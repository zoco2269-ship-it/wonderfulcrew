// /api/search — grants.html 전용 Claude 프록시
// 클라이언트는 { query, system?, model?, max_tokens? } 만 보냄. API 키는 서버 환경변수에서만 읽음.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
  }

  try {
    const {
      query,
      system,
      model = 'claude-sonnet-4-20250514',
      max_tokens = 1500
    } = req.body || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'query is required' });
    }

    const defaultSystem =
      'You are a helpful assistant that searches and summarizes information about grants, scholarships, and funding opportunities for cabin crew / aviation students in Korea. Respond in Korean. Be concise, structured, and cite source names when possible. If you are not sure, say so rather than guessing.';

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens,
        system: system || defaultSystem,
        messages: [{ role: 'user', content: query }]
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data?.error?.message || 'Upstream error', detail: data });
    }

    const text =
      (data && data.content && data.content[0] && data.content[0].text) || '';

    return res.status(200).json({ text, raw: data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
