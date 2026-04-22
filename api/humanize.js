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
//    Anthropic is safe to create at module scope (handles undefined key
//    gracefully until a request is made).
//    Supabase is created INSIDE the handler so a missing SUPABASE_URL env var
//    never crashes the module before it can return a proper JSON error.
// ---------------------------------------------------------------------------

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
//    Accepts the supabase client as a parameter (created inside handler).
//    Swallows errors — a DB failure never degrades the user response.
// ---------------------------------------------------------------------------

async function logToDatabase(supabase, originalText, humanizedText) {
  const { error } = await supabase
    .from("generations")
    .insert({
      original_text:  originalText,
      humanized_text: humanizedText,
    });

  if (error) {
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

  // ── 5a. Environment Variable Guard ───────────────────────────────────────
  // Validate required env vars FIRST so a misconfigured deployment returns
  // a clear JSON error instead of an unhandled module-level crash.
  const missingVars = [
    "ANTHROPIC_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((k) => !process.env[k]);

  if (missingVars.length > 0) {
    console.error("[Config] Missing environment variables:", missingVars);
    return res.status(500).json({
      success: false,
      error:   `Server misconfiguration: missing env vars: ${missingVars.join(", ")}.`,
    });
  }

  // ── 5b. Lazy Supabase Client ──────────────────────────────────────────────
  // Created here (not at module scope) so a missing URL never crashes the
  // module before we can return a proper JSON error response.
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // ── 5c. Method Guard ─────────────────────────────────────────────────────
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      success: false,
      error:   "Method Not Allowed. Use POST.",
    });
  }

  // ── 5d. CORS Headers ─────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin",  process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // ── 5h. Input Validation ─────────────────────────────────────────────────
  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({
      success: false,
      error:   validationError,
    });
  }

  const originalText = req.body.text.trim();

  // ── 5i. Claude API Call ───────────────────────────────────────────────────
  let humanizedText;

  try {
    console.log(`[Anthropic] Sending ${originalText.length} chars to Claude...`);

    const message = await anthropic.messages.create({
      model:      "claude-3-5-sonnet-20240620",
      max_tokens:  4096,
      system:      HUMANIZE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: originalText }],
    });

    const contentBlock = message.content.find((b) => b.type === "text");
    if (!contentBlock || !contentBlock.text) {
      throw new Error("Claude returned an empty or unexpected response structure.");
    }

    humanizedText = contentBlock.text.trim();
    console.log(`[Anthropic] Received ${humanizedText.length} chars. Stop reason: ${message.stop_reason}`);

  } catch (anthropicError) {
    console.error("[Anthropic] API call failed:", anthropicError.message);
    return res.status(500).json({
      success: false,
      error:   "The AI service encountered an error. Please try again shortly.",
    });
  }

  // ── 5j. Return response immediately, then log to DB ──────────────────────
  res.status(200).json({
    success: true,
    result:  humanizedText,
  });

  await logToDatabase(supabase, originalText, humanizedText);
}
