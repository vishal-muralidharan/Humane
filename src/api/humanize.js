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
