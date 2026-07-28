// AI 면접사진 완성(프리미엄) — 업로드 사진을 스튜디오급 승무원 면접 증명사진으로 편집.
// 구글 제미나이 이미지 편집("Nano Banana", gemini-2.5-flash-image). 원가 사진 1장당 수십 원 수준.
// 사진은 편집에만 사용하고 저장하지 않음.
const MODEL = 'gemini-2.5-flash-image';

function buildPrompt(target) {
  const airline = target === 'international'
    ? 'Styling should suit an international airline cabin-crew interview.'
    : 'Styling should suit a Korean domestic airline cabin-crew interview.';
  return `You are a professional ID-photo retoucher for airline cabin-crew (flight attendant) job applicants. Edit the given photo into a clean, polished, studio-quality interview ID photo. ${airline}

Apply ALL of the following, keeping everything natural and professional:
- Makeup: natural but defined interview makeup — clean groomed brows, subtle neutral eyeshadow with a soft outer accent, natural eyeliner, even smooth skin (remove blemishes/oil shine but keep natural skin texture), healthy natural blush, and a natural rosy-to-coral lip. Not heavy, not glamorous — clean and bright.
- Hair: neaten the hair into a sleek, tidy low bun / chignon updo with NO flyaways; forehead, ears and jawline visible and clean.
- Expression & posture: keep a warm, bright, confident closed-lip or gentle smile; straighten the posture and shoulders slightly.
- Wardrobe: a well-fitted navy blazer over a white blouse.
- Background: replace with a clean, evenly-lit solid light-blue ID-photo background.

CRITICAL: Preserve the person's identity exactly — same face shape, eyes, nose, mouth, and overall likeness. Do NOT beautify into a different person, do NOT change ethnicity, age, or facial proportions. This must clearly be the same person.

Output ONLY the edited photo image.`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'AI 키가 설정되지 않았어요. (GEMINI_API_KEY)' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  let image = String(body.image || '');
  const comma = image.indexOf(',');
  if (image.indexOf('data:') === 0 && comma > -1) image = image.slice(comma + 1);
  if (!image) return res.status(400).json({ error: '사진이 필요합니다.' });

  const mediaType = /png/i.test(body.mediaType || '') ? 'image/png' : 'image/jpeg';
  const target = body.target === 'international' ? 'international' : 'domestic';

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: buildPrompt(target) },
            { inline_data: { mime_type: mediaType, data: image } }
          ]
        }],
        generationConfig: { responseModalities: ['IMAGE'] }
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: 'AI 편집 실패', detail: d.error || d });

    const parts = (((d.candidates || [])[0] || {}).content || {}).parts || [];
    let out = null, outType = 'image/png';
    for (const p of parts) {
      const inl = p.inline_data || p.inlineData;
      if (inl && inl.data) { out = inl.data; outType = inl.mime_type || inl.mimeType || outType; break; }
    }
    if (!out) return res.status(500).json({ error: 'AI가 이미지를 반환하지 않았어요.', detail: parts });

    res.status(200).json({ image: 'data:' + outType + ';base64,' + out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
