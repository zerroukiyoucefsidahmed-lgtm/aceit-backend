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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: 'You are an expert study assistant. Always respond with valid JSON only. No markdown, no explanation.' },
          { role: 'user', content: `Create exactly ${count} comprehensive flashcards about: "${prompt}". Return ONLY this JSON array: [{"q":"question","a":"answer","explain":"why important","difficulty":"easy|medium|hard","opts":["wrong1","wrong2","wrong3","correct answer"]}]` }
        ]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    let text = data.choices[0].message.content;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const cards = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
    return res.status(200).json({ cards });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
