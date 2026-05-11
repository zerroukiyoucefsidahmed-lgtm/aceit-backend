export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { essay } = req.body;
  if (!essay) return res.status(400).json({ error: 'Essay is required' });
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5, max_tokens: 1500,
        messages: [
          { role: 'system', content: 'You are an expert essay reviewer. Return ONLY valid JSON. No markdown.' },
          { role: 'user', content: `Review this essay and return JSON: {"grade":"A/B/C/D/F","score":85,"strengths":["point1","point2"],"improvements":["point1","point2"],"grammar_errors":["error1"],"summary":"overall feedback in 2 sentences"}. Essay: ${essay}` }
        ]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    let text = data.choices[0].message.content;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return res.status(200).json(JSON.parse(text));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
