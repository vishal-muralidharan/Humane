import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

let groq;

const HUMANIZE_SYSTEM_PROMPT = `You are a senior domain expert writing a quick, casual, and highly conversational draft to a colleague. 

Your sole task is to rewrite the user's text so it sounds completely natural, as if spoken aloud over a coffee break. You MUST adhere to these strict constraints:
1. TONE: Casual, slightly asymmetrical, and direct. 
2. STRUCTURE: Drastically vary your sentence length. Mix very short, punchy sentences (3-5 words) with longer, flowing, conversational ones.
3. VOCABULARY: Use plain, everyday English. Absolutely NO corporate jargon, poetic language, or complex SAT words. If a 10th grader wouldn't use the word in conversation, do not use it.
4. BANNED WORDS: You are strictly forbidden from using: delve, testament, tapestry, crucial, underscore, multifaceted, intricate, vital, realm, symphony, beacon, or landscape.
5. FORMAT: Return ONLY the rewritten text. Do not include any preambles, greetings, or conversational filler like 'Here is the rewrite.'

### EXAMPLE 1 ###
Input: 'It is crucial to underscore the multifaceted nature of this problem, as it requires an intricate solution.'
Output: 'This problem has a lot of moving parts. We need to look at it from a few different angles to actually fix it.'

### EXAMPLE 2 ###
Input: 'The rapid advancement of artificial intelligence stands as a testament to human ingenuity, navigating the complex landscape of modern technology.'
Output: 'AI is moving incredibly fast right now. It's wild to see how quickly we're figuring out this new tech.'`;

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
      temperature: 0.95,
      top_p: 0.90,
      messages: [
        { role: "system",  content: HUMANIZE_SYSTEM_PROMPT },
        { role: "user",    content: `Rewrite the following text according to your system instructions:\n\n${originalText}` },
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
