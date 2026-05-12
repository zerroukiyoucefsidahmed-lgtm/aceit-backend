import { validateRequest, sanitizeInput } from './middleware.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-App-Version');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const validationError = validateRequest(req, res);
  if (validationError) return;

  const { essay } = req.body;
  const cleanEssay = sanitizeInput(essay);
  if (!cleanEssay) return res.status(400).json({ error: 'Essay is required' });
  if (cleanEssay.length < 50) return res.status(400).json({ error: 'Essay too short' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'You are an essay reviewer. Respond with ONLY valid JSON. No markdown.' },
          { role: 'user', content: `Review this essay. Return ONLY: {"grade":"B","score":75,"strengths":["s1","s2"],"improvements":["i1","i2"],"grammar_errors":["e1"],"summary":"Two sentences."}. Essay: ${cleanEssay.slice(0, 2000)}` }
        ]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: 'AI service error' });
    let text = data.choices[0].message.content.trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'Invalid response' });
    const result = JSON.parse(text.slice(start, end + 1));
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
