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

  const { message, history = [] } = req.body;
  const cleanMessage = sanitizeInput(message);
  if (!cleanMessage) return res.status(400).json({ error: 'Message is required' });

  try {
    const safeHistory = history
      .slice(-6)
      .filter(m => m.role && m.content)
      .map(m => ({ role: m.role, content: sanitizeInput(m.content) }));

    const messages = [
      { role: 'system', content: 'You are AceIt AI Tutor — a friendly expert study assistant. Give clear helpful explanations. Use examples. Be encouraging. Keep responses under 200 words.' },
      ...safeHistory,
      { role: 'user', content: cleanMessage }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 500,
        messages
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: 'AI service error' });
    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
