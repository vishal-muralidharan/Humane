// =============================================================================
// api/humanize.js
// Vercel Serverless Function — AI Text Humanizer
//
// Route  : POST /api/humanize
// Payload: { "text": "..." }
// Returns: { "success": true, "result": "..." }
//
// Dependencies (add to package.json):
//   @anthropic-ai/sdk    — Claude API client
//   @supabase/supabase-js — Postgres client via Supabase
// =============================================================================

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// 1. CLIENT INITIALISATION
//    Both clients are created once at module scope so they are reused across
//    warm-invocations of the same serverless instance (Vercel keeps them alive
//    for a short period between requests).  Cold-start overhead is paid only
//    once per instance lifecycle.
// ---------------------------------------------------------------------------

const anthropic = new Anthropic({
  // ANTHROPIC_API_KEY is read automatically by the SDK from process.env,
  // but we are explicit here so the intent is obvious in code review.
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,       // e.g. https://xxxx.supabase.co
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Use the service-role key on the server
                                          // (never the anon key) — it bypasses RLS.
);

// ---------------------------------------------------------------------------
// 2. SYSTEM PROMPT — The Core Humanization Engine
//    This prompt is the most critical piece of the whole application.
//    Each instruction directly targets a detectable AI-writing pattern.
// ---------------------------------------------------------------------------

const HUMANIZE_SYSTEM_PROMPT = `You are an expert ghostwriter who rewrites AI-generated text so that it reads as authentically human-written prose. Your output must pass AI-detection tools such as GPTZero and Originality.ai.

Follow every rule below without exception:

BURSTINESS — Sentence Length Variation
- Deliberately alternate between very short sentences (3–8 words) and long, complex multi-clause sentences (25–45 words).
- Never write three consecutive sentences of similar length.
- Occasionally use a single-word or two-word sentence for rhetorical punch.

PERPLEXITY — Vocabulary & Unpredictability
- Replace predictable, high-frequency algorithmic word choices with natural, slightly unconventional alternatives.
- Use specific, concrete nouns and active verbs instead of abstract generalisations.
- Vary your sentence openers: do not start more than two sentences in a row with the same grammatical structure (e.g. subject + verb).
- Include natural discourse markers: "In fact,", "Still,", "That said,", "Here's the thing —", used sparingly.

BANNED WORDS — Strip Every Instance
Never use any of the following words or phrases, even once:
delve, testament, tapestry, multifaceted, nuanced, crucial, underscore, pivotal, realm, embark, beacon, elevate, foster, leverage, game-changer, paradigm shift, at its core, it is worth noting, it is important to note, in conclusion, in summary, in today's world, in the digital age, the landscape, the world of, not only...but also.

TONE & MEANING PRESERVATION
- Maintain the original core meaning, intent, and factual content exactly.
- Preserve the original word count within ±10%.
- Preserve the original language (do not translate).
- Match the original register (formal stays formal, casual stays casual).

OUTPUT FORMAT
- Return ONLY the rewritten text.
- Do not include any preamble, explanation, metadata, or conversational filler.
- Do not say "Here is the rewritten version" or anything similar.
- Do not wrap the output in quotes or markdown code blocks.`;

// ---------------------------------------------------------------------------
// 3. INPUT VALIDATION HELPERS
// ---------------------------------------------------------------------------

const MAX_INPUT_CHARS = 10_000; // ~7 500 tokens — safely within Claude's context

function validatePayload(body) {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object.";
  }
  if (typeof body.text !== "string" || body.text.trim().length === 0) {
    return "The 'text' field is required and must be a non-empty string.";
  }
  if (body.text.length > MAX_INPUT_CHARS) {
    return `Input text exceeds the maximum allowed length of ${MAX_INPUT_CHARS} characters.`;
  }
  return null; // null == valid
}

// ---------------------------------------------------------------------------
// 4. DATABASE LOGGING
//    Runs the Supabase INSERT and logs any failure without re-throwing.
//    Because the response has already been sent to the client before this
//    is awaited (see fire-and-forget pattern in the handler), a DB error
//    never degrades the user experience.
// ---------------------------------------------------------------------------

async function logToDatabase(originalText, humanizedText) {
  const { error } = await supabase
    .from("generations")
    .insert({
      // 'id' is omitted — the column default (gen_random_uuid()) handles it.
      original_text:   originalText,
      humanized_text:  humanizedText,
    });

  if (error) {
    // Log server-side only. Never expose DB internals to the client.
    console.error("[Supabase] INSERT failed:", {
      message: error.message,
      code:    error.code,
      hint:    error.hint,
    });
  } else {
    console.log("[Supabase] Generation logged successfully.");
  }
}

// ---------------------------------------------------------------------------
// 5. MAIN HANDLER — Vercel Serverless Function Entry Point
// ---------------------------------------------------------------------------

export default async function handler(req, res) {

  // ── 5a. Method Guard ─────────────────────────────────────────────────────
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      success: false,
      error:   "Method Not Allowed. Use POST.",
    });
  }

  // ── 5b. CORS Headers (adjust origin in production) ───────────────────────
  // Vercel handles CORS at the edge via vercel.json for most cases, but
  // setting it here ensures correctness even when testing locally with
  // `vercel dev`.
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle pre-flight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // ── 5c. Input Validation ─────────────────────────────────────────────────
  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({
      success: false,
      error:   validationError,
    });
  }

  const originalText = req.body.text.trim();

  // ── 5d. Claude API Call ───────────────────────────────────────────────────
  let humanizedText;

  try {
    console.log(`[Anthropic] Sending ${originalText.length} chars to Claude...`);

    const message = await anthropic.messages.create({
      model:      "claude-3-5-sonnet-20240620",
      max_tokens:  4096,  // generous ceiling; Claude won't exceed the actual output size

      // The system prompt defines Claude's persona and hard rules.
      system: HUMANIZE_SYSTEM_PROMPT,

      messages: [
        {
          role:    "user",
          // We do not add any extra framing — the system prompt already fully
          // scopes Claude's task.  Sending raw text keeps the output clean.
          content: originalText,
        },
      ],
    });

    // Extract the text content block from the response.
    // Claude always returns at least one content block of type "text".
    const contentBlock = message.content.find((b) => b.type === "text");

    if (!contentBlock || !contentBlock.text) {
      throw new Error("Claude returned an empty or unexpected response structure.");
    }

    humanizedText = contentBlock.text.trim();
    console.log(`[Anthropic] Received ${humanizedText.length} chars. Stop reason: ${message.stop_reason}`);

  } catch (anthropicError) {
    // Catch Anthropic SDK errors (network issues, rate limits, invalid API key, etc.)
    console.error("[Anthropic] API call failed:", anthropicError.message);

    return res.status(500).json({
      success: false,
      error:   "The AI service encountered an error. Please try again shortly.",
    });
  }

  // ── 5e. Return Response to Client (immediately) ───────────────────────────
  // We send the response NOW, before waiting for the DB write.
  // The Supabase INSERT is then awaited below in a non-blocking manner.
  // 
  // IMPORTANT: Vercel keeps the serverless function alive until all Promises
  // resolve, so the DB write WILL complete — the user just doesn't have to
  // wait for it.  This pattern is sometimes called "fire-and-forget" but is
  // more accurately a "background task within the same invocation."
  res.status(200).json({
    success: true,
    result:  humanizedText,
  });

  // ── 5f. Async Database Logging (after response is sent) ──────────────────
  // Any error here is swallowed inside logToDatabase() and only logged
  // server-side, so it cannot crash the invocation or affect the client.
  await logToDatabase(originalText, humanizedText);
}
