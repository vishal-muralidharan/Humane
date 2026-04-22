import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

let groq;

const HUMANIZE_SYSTEM_PROMPT = `You are a world-class professional editor and ghostwriter. Your absolute primary goal is to rewrite AI-generated text to pass 100% as human-written to AI detection tools (like GPTZero, Originality.ai, Turnitin, Winston AI). 
The output MUST NOT be flagged as AI. 

To achieve maximum human-like "burstiness" and "perplexity" (the key metrics detectors use), you must employ these strategies:

1. VARY SENTENCE LENGTHS DRASTICALLY
- Write a mix of very short punchy sentences (5-10 words) and longer, more descriptive compound sentences. AI writes in uniform sentence lengths. Humans do not.
- Vary your introductory clauses. Never start three consecutive sentences with the same word or structure.

2. FLATTEN THE VOCABULARY AND TRANSITIONS
- AI uses high-school essay transitions. COMPLETELY BAN the use of: "Furthermore", "Moreover", "Additionally", "Consequently", "Therefore", "Thus", "In conclusion", "Ultimately". Replace them with simpler, direct human connectives like "Also", "Because of this", "So", "But", or just start the sentence directly.
- Avoid SAT-level "fancy" vocabulary unless specifically matching a deeply technical input. Keep the language grounded, active, and direct.

3. FORBIDDEN AI BUZZWORDS
Never use any of these classic AI markers under ANY circumstances: delve, testament, tapestry, multifaceted, nuanced, crucial, underscore, pivotal, realm, embark, beacon, elevate, foster, leverage, game-changer, paradigm shift, at its core, it is worth noting, navigate, seamless, illuminating.

4. ACCURACY AND FORMATTING OVERRIDE
- Never alter the original facts, core meaning, or data.
- If the original text contains lists, bullet points, headers, or formulas, retain them exactly in structure. Do not flatten lists into paragraphs.

OUTPUT FORMAT
- Output EXACTLY the rewritten text and NOTHING ELSE.
- No introductions, no "Here is your text", no summary. Just raw output.`;

// ---------------------------------------------------------------------------
// 3. INPUT VALIDATION
// ---------------------------------------------------------------------------

const MAX_INPUT_CHARS = 10_000;

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
  return null;
}

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

export default async function handler(req, res) {
  try {
    const missingVars = ["GROQ_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
      .filter((k) => !process.env[k]);

  if (missingVars.length > 0) {
    console.error("[Config] Missing environment variables:", missingVars);
    return res.status(500).json({
      success: false,
      error:   `Server misconfiguration: missing env vars: ${missingVars.join(", ")}.`,
    });
  }

  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method Not Allowed. Use POST." });
  }

  res.setHeader("Access-Control-Allow-Origin",  process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  const originalText = req.body.text.trim();
  let humanizedText;

  try {
    console.log(`[Groq] Sending ${originalText.length} chars to Llama 3.3 70B...`);

    const completion = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile", // free on Groq; updated to 3.3
      max_tokens:  4096,
      temperature: 0.95, // Even higher variation to prevent robotic predictability
      messages: [
        { role: "system",  content: HUMANIZE_SYSTEM_PROMPT },
        { role: "user",    content: originalText },
      ],
    });

    const choice = completion.choices?.[0];
    humanizedText = choice?.message?.content?.trim();

    if (!humanizedText) {
      throw new Error("Groq returned an empty or unexpected response.");
    }

    console.log(`[Groq] Received ${humanizedText.length} chars. Finish reason: ${choice.finish_reason}`);

  } catch (groqError) {
    console.error("[Groq] API call failed:", groqError.message);
    return res.status(500).json({
      success: false,
      error:   `The AI service encountered an error: ${groqError.message || "Please try again shortly."}`,
    });
  }
  try {
    await logToDatabase(supabase, originalText, humanizedText);
  } catch (dbError) {
    console.error("[Supabase] Unexpected error during insert:", dbError);
    // Don't fail the request if DB fails.
  }

  res.status(200).json({ success: true, result: humanizedText });
  } catch (err) {
    console.error("[Unhandled Exception]", err);
    res.status(500).json({ success: false, error: "An unexpected server error occurred." });
  }
}
