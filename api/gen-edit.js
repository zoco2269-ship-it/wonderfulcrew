// 내부 전용 이미지 편집 엔드포인트 (Gemini nano-banana, gemini-2.5-flash-image).
// 커스텀 프롬프트로 사진을 편집. secret 가드로 보호 (임시 사용 후 제거 가능).
const MODEL = 'gemini-2.5-flash-image';
const SECRET = 'wc-2026-genedit-9x7q';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'no key (GEMINI_API_KEY)' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  if (body.secret !== SECRET) return res.status(403).json({ error: 'forbidden' });

  let image = String(body.image || '');
  const c = image.indexOf(',');
  if (image.indexOf('data:') === 0 && c > -1) image = image.slice(c + 1);
  const prompt = String(body.prompt || '');
  if (!image || !prompt) return res.status(400).json({ error: 'image + prompt required' });
  const mt = /png/i.test(body.mediaType || '') ? 'image/png' : 'image/jpeg';

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [ { text: prompt }, { inline_data: { mime_type: mt, data: image } } ] }],
        generationConfig: { responseModalities: ['IMAGE'] }
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: 'fail', detail: d.error || d });
    const parts = (((d.candidates || [])[0] || {}).content || {}).parts || [];
    let out = null, ot = 'image/png';
    for (const p of parts) { const inl = p.inline_data || p.inlineData; if (inl && inl.data) { out = inl.data; ot = inl.mime_type || inl.mimeType || ot; break; } }
    if (!out) return res.status(500).json({ error: 'no image', detail: parts });
    res.status(200).json({ image: 'data:' + ot + ';base64,' + out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
