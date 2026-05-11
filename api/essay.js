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
        temperature: 0.3,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'You are an essay reviewer. Respond with ONLY valid JSON. No text before or after. No markdown.' },
          { role: 'user', content: `Review this essay. Respond with ONLY this exact JSON format, nothing else: {"grade":"B","score":75,"strengths":["strength1","strength2"],"improvements":["improvement1","improvement2"],"grammar_errors":["error1"],"summary":"Two sentence summary here."}. Essay: ${essay.slice(0, 2000)}` }
        ]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    let text = data.choices[0].message.content.trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'AI returned invalid format' });
    const result = JSON.parse(text.slice(start, end + 1));
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
