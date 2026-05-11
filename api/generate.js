export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt, count = 8 } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: 'You are a study assistant. You MUST respond with ONLY a valid JSON array. No text before or after. No markdown. No explanation. Just the raw JSON array starting with [ and ending with ].' },
          { role: 'user', content: `Create exactly ${count} flashcards about: "${prompt}". Respond with ONLY this JSON array, nothing else: [{"q":"question","a":"answer","explain":"one sentence why this matters","difficulty":"easy"}]` }
        ]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    let text = data.choices[0].message.content.trim();
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'AI returned invalid format' });
    const cards = JSON.parse(text.slice(start, end + 1));
    return res.status(200).json({ cards });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
