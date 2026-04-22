import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

let groq;

const HUMANIZE_SYSTEM_PROMPT = `You are an expert ghostwriter who rewrites AI-generated text so that it reads as authentically human-written prose. Your output must pass AI-detection tools such as GPTZero, Quillbot and Originality.ai.

Follow every rule below without exception:

BURSTINESS — Sentence Length Variation
- Alternate between short sentences and longer, complex sentences naturally.
- Avoid writing completely disjointed, fragmented, or overly robotic "single word" sentences unless it genuinely fits the context.
- Keep the flow conversational but professional if the input is technical or academic.

PERPLEXITY — Vocabulary & Unpredictability
- Replace predictable, high-frequency algorithmic word choices with natural, slightly unconventional alternatives.
- Use specific, concrete nouns and active verbs instead of abstract generalisations.
- Ensure the text still sounds cohesive and logical. Do not force unnatural discourse markers like "Here's the thing —" or "No." or "Yes." into formal, technical, or academic explanations.

BANNED WORDS — Strip Every Instance
Never use any of the following words or phrases, even once:
delve, testament, tapestry, multifaceted, nuanced, crucial, underscore, pivotal, realm, embark, beacon, elevate, foster, leverage, game-changer, paradigm shift, at its core, it is worth noting, it is important to note, in conclusion, in summary, in today's world, in the digital age, the landscape, the world of, not only...but also.

TONE & MEANING PRESERVATION
- Maintain the original core meaning, intent, factual content, and structure exactly. 
- If the input has bullet points or numbered lists, you MUST keep those bullet points or numbered lists in the output.
- Preserve the original word count within ±10%.
- Preserve the original language (do not translate).
- Match the original register (formal stays formal, casual stays casual).

OUTPUT FORMAT
- Return ONLY the rewritten text.
- Do not include any preamble, explanation, or conversational filler.
- Do not say "Here is the rewritten version" or anything similar.
- Do not wrap the output in quotes or markdown code blocks.`;

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
      temperature: 0.85, // slightly higher than default → more varied, natural-feeling output
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
