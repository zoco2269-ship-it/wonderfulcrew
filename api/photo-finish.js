// AI 면접사진 완성(프리미엄) — 업로드 사진을 스튜디오급 승무원 면접 증명사진으로 편집.
// 구글 제미나이 이미지 편집("Nano Banana", gemini-2.5-flash-image). 원가 사진 1장당 수십 원 수준.
// 사진은 편집에만 사용하고 저장하지 않음.
const MODEL = 'gemini-2.5-flash-image';

function buildPrompt(o) {
  const airline = o.target === 'international'
    ? 'Styling should suit an international airline cabin-crew interview.'
    : 'Styling should suit a Korean domestic airline cabin-crew interview.';
  const hex = (v, d) => (/^#[0-9a-fA-F]{6}$/.test(v || '') ? v : d);
  const bg = `a clean, evenly-lit solid studio background of the color ${hex(o.bgHex, '#9CC3E8')}`;
  const jkStyleMap = {
    single: 'a well-fitted single-breasted tailored blazer with notch lapels',
    collarless: 'a well-fitted collarless round-neck tailored jacket (no lapels)',
    double: 'a well-fitted double-breasted tailored blazer'
  };
  const jkStyle = jkStyleMap[o.jacketStyle] || jkStyleMap.single;
  const jk = `${jkStyle} in the color ${hex(o.jacketHex, '#20304F')}`;
  const neckMap = {
    shirt: 'a white dress shirt with a clearly visible pointed collar (a proper collared shirt), worn under the jacket',
    round: 'a collarless white blouse with a plain smooth ROUND neckline — absolutely NO collar of any kind, a clean rounded neckline',
    highneck: 'a white blouse buttoned all the way up to a high, closed neckline covering the neck — modest high-neck style, no open collar',
    innertop: 'a simple elegant ivory round-neck inner top (a clean fine-knit/blouse top with a smooth round neckline, no collar)'
  };
  const neck = neckMap[o.neckline] || neckMap.round;
  return `You are a professional ID-photo retoucher for airline cabin-crew (flight attendant) job applicants. Edit the given photo into a clean, polished, studio-quality interview ID photo. ${airline}

Apply ALL of the following, keeping everything natural and professional:
- Expression (MANDATORY, MOST IMPORTANT — do this extremely well): give her a warm, bright, genuine smile where the corners of the mouth lift up gently and the UPPER row of teeth is naturally visible — a soft, pretty, welcoming flight-attendant smile, exactly like a real professional interview headshot. The smile must look 100% photorealistic and natural: relaxed lips, evenly-lit clean upper teeth of normal size and shape, a real Duchenne smile that also lightly engages the eyes. STRICTLY AVOID an unnatural result — no forced or stiff grin, no overly wide or gummy smile, no lower teeth showing, no clenched or crooked or oversized/fake-looking teeth, nothing creepy or uncanny. It should look like the SAME person simply caught in a beautiful natural smile. A closed-lip or expressionless mouth is NOT acceptable.
- Makeup: natural but defined interview makeup — clean groomed brows, subtle neutral eyeshadow with a soft outer accent, natural eyeliner, even smooth skin (remove blemishes/oil shine but keep natural skin texture), healthy natural blush, and a natural rosy-to-coral lip. Clean and bright, not heavy.
- Hair: smoothly pulled back into a small, low, neat bun at the nape, with a SOFT NATURAL VOLUME at the crown/top of the head — do NOT plaster the hair completely flat against the scalp; keep a gentle rounded lift on top for an elegant silhouette. From this FRONT view the hairstyle must look sleek and clean: NO bun, knot, ponytail, or tied-hair lump may be visible or protrude at the sides of the head or by the neck/shoulders. No center part; no flyaways; forehead, ears and jawline clean and visible.
- Wardrobe (follow EXACTLY as described): ${jk}, and worn underneath it: ${neck}. Render this exact collar/neckline style clearly and make it the visible neckline in the photo.
- Background: replace with ${bg} — match this background color exactly.
- Posture: straighten the shoulders and head slightly.

CRITICAL: Preserve the person's identity exactly — same face shape, eyes, nose, and overall likeness. Do NOT turn them into a different person, and do NOT change ethnicity, age, or facial proportions. It must clearly be the same person, just polished.

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
  const opts = {
    target: body.target === 'international' ? 'international' : 'domestic',
    bgHex: body.bgHex,
    jacketHex: body.jacketHex,
    jacketStyle: ['single', 'collarless', 'double'].indexOf(body.jacketStyle) > -1 ? body.jacketStyle : 'single',
    neckline: ['shirt', 'round', 'highneck', 'innertop'].indexOf(body.neckline) > -1 ? body.neckline : 'round'
  };

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: buildPrompt(opts) },
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
