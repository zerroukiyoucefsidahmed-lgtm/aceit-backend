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

  const { prompt, count = 8 } = req.body;
  const cleanPrompt = sanitizeInput(prompt);
  if (!cleanPrompt) return res.status(400).json({ error: 'Prompt is required' });
  if (cleanPrompt.length > 3000) return res.status(400).json({ error: 'Prompt too long' });

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
        max_tokens: 2000,
        messages: [
          { role: 'system', content: 'You are a study assistant. You MUST respond with ONLY a valid JSON array. No text before or after. No markdown.' },
          { role: 'user', content: `Create exactly ${Math.min(count, 10)} flashcards about: "${cleanPrompt}". Return ONLY: [{"q":"question","a":"answer","explain":"why important","difficulty":"easy|medium|hard","opts":["wrong1","wrong2","wrong3","correct"]}]` }
        ]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: 'AI service error' });
    let text = data.choices[0].message.content.trim();
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'Invalid AI response' });
    const cards = JSON.parse(text.slice(start, end + 1));
    return res.status(200).json({ cards });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
