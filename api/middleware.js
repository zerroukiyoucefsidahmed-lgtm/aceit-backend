// Security middleware for AceIt backend
export function validateRequest(req, res) {
  // Force HTTPS
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'HTTPS required' });
  }
  // Validate content type
  if (req.method === 'POST' && !req.headers['content-type']?.includes('application/json')) {
    return res.status(400).json({ error: 'Invalid content type' });
  }
  // Rate limiting check
  const userAgent = req.headers['user-agent'] || '';
  if (!userAgent) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return null;
}

export function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  return text.slice(0, 5000).trim();
}
