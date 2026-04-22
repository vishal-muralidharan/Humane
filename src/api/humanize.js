/**
 * src/api/humanize.js — Frontend API helper (Phase 2)
 * ====================================================
 * Wraps the POST /api/humanize serverless function call.
 * Import and call humanizeText(text) from any component.
 *
 * Returns: the humanized string on success.
 * Throws:  an Error with a user-readable message on failure.
 */

/**
 * @param {string} text — The AI-generated text to humanize.
 * @returns {Promise<string>} — The humanized rewrite.
 */
export async function humanizeText(text) {
  const response = await fetch('/api/humanize', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text }),
  });

  const textData = await response.text();
  let data;
  try {
    data = JSON.parse(textData);
  } catch (err) {
    throw new Error(`Server error (${response.status}): ${textData}`);
  }

  if (!response.ok || !data.success) {
    throw new Error(data?.error || `Server error (${response.status})`);
  }

  return data.result;
}
