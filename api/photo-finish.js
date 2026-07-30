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
  // 사용자가 미리보기에서 고른 메이크업을 그대로 반영
  const validHex = (v) => (/^#[0-9a-fA-F]{6}$/.test(v || '') ? v : null);
  const strength = (v) => (v > 0.66 ? 'bold' : (v > 0.33 ? 'medium' : 'soft'));
  const m = o.makeup;
  let makeup;
  if (m && typeof m === 'object' && (validHex(m.lip) || validHex(m.eye) || m.liner || m.smoky)) {
    const parts = ['clean, softly groomed brows', 'even smooth skin (remove blemishes and oil shine but keep natural skin texture)', 'a healthy natural blush'];
    parts.push(validHex(m.lip) ? `a ${strength(m.lipInt)} lip color very close to ${validHex(m.lip)}, applied cleanly` : 'a natural rosy-coral lip');
    if (validHex(m.eye)) parts.push(`${strength(m.eyeInt)} eyeshadow in a shade close to ${validHex(m.eye)}, blended softly and concentrated toward the outer corner of the eye (light at the inner corner)`);
    if (m.smoky) parts.push('a soft smoky-eye effect at the outer corner, subtly smudged and blended (not harsh)');
    if (m.liner) parts.push('a fine natural eyeliner along the upper lash line with a slight tapered wing at the outer corner');
    makeup = 'apply exactly this interview makeup, matching the colors as closely as possible: ' + parts.join('; ') + '. Keep it clean, natural and professional — never heavy or garish.';
  } else {
    makeup = 'natural but defined interview makeup — clean groomed brows, subtle neutral eyeshadow with a soft outer accent, natural eyeliner, even smooth skin, healthy natural blush, and a natural rosy-to-coral lip. Clean and bright, not heavy.';
  }
  return `You are a professional ID-photo retoucher for airline cabin-crew (flight attendant) job applicants. Edit the given photo into a clean, polished, studio-quality interview ID photo. ${airline}

The source may be a casual snapshot (home lighting, casual clothes, relaxed pose) — TRANSFORM it into a formal, composed cabin-crew interview ID photo. Change the expression, posture, framing, wardrobe, hair and background to the professional standards below, while keeping the person's facial identity. The result should clearly look like a proper studio ID photo, distinctly more polished and formal than the casual original.

- Composition: reframe/crop to a standard front-facing ID (passport-style) photo — head and upper shoulders centered, face squared to the camera, eyes level and looking straight at the lens, calm upright posture. Remove any casual items such as necklaces or accessories.

Apply ALL of the following, keeping everything natural and professional:
- Expression (MANDATORY, MOST IMPORTANT — do this extremely well): This is a formal ID photo, so REPLACE the source expression with a composed, refined interview smile — regardless of what the original shows. Even if the source photo is a casual snapshot with a big open-mouthed laugh, squinted eyes, or an awkward expression, do NOT copy it; instead give her a calm, elegant, gentle smile where the corners of the mouth lift up softly and only the UPPER row of teeth is naturally visible — a poised, pretty, welcoming flight-attendant smile, exactly like a real professional interview headshot (not a laugh). The eyes should be open, bright and relaxed (not squinting). The smile must look 100% photorealistic and natural: relaxed lips, evenly-lit clean upper teeth of normal size and shape, a gentle Duchenne smile that lightly engages the eyes. The mouth and lips must look PRETTY and refined: well-shaped symmetric lips, corners lifted evenly, a graceful elegant camera-ready smile like a polished professional model headshot. STRICTLY AVOID an unnatural or unflattering result — no forced or stiff grin, no overly wide or gummy smile, no lower teeth showing, no clenched/crooked/oversized/fake-looking teeth, no awkward or tacky (촌스러운) mouth shape, nothing creepy or uncanny. It should look like the SAME person simply caught in a beautiful, elegant natural smile. A closed-lip or expressionless mouth is NOT acceptable.
- Makeup: natural but defined interview makeup — clean groomed brows, subtle neutral eyeshadow with a soft outer accent, natural eyeliner, even smooth skin (remove blemishes/oil shine but keep natural skin texture), healthy natural blush, and a natural rosy-to-coral lip. Clean and bright, not heavy.
- Hair: ALL hair smoothly slicked back into a small low bun at the nape, with a SOFT NATURAL VOLUME at the crown/top (not plastered flat — a gentle rounded lift on top). CRITICAL for this front view: every strand must be kept BEHIND the ears and BEHIND the shoulders — NO hair may fall forward onto the neck, jaw, cheeks or shoulders, and NO bun, knot, ponytail or tied-hair lump may be visible anywhere in the frame. Both sides of the neck and face must be completely clean and clear of hair. No center part; no flyaways; forehead, ears and jawline fully visible.
- Wardrobe (follow EXACTLY as described): ${jk}, and worn underneath it: ${neck}. Render this exact collar/neckline style clearly and make it the visible neckline in the photo.
- Background: replace with ${bg} — match this background color exactly.
- Posture: straighten the shoulders and head slightly.

CRITICAL: Preserve the person's FACIAL IDENTITY — same face shape, eyes, nose and overall likeness, so it is unmistakably the same person. Do NOT turn them into a different person, and do NOT change ethnicity, age, or facial proportions. But DO transform the expression, posture, framing, hair, wardrobe and background exactly as instructed above — the identity stays, everything else becomes polished and formal.

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
    neckline: ['shirt', 'round', 'highneck', 'innertop'].indexOf(body.neckline) > -1 ? body.neckline : 'round',
    makeup: (body.makeup && typeof body.makeup === 'object') ? body.makeup : null
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
