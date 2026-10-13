// AI 면접사진 완성(프리미엄) — 업로드 사진을 스튜디오급 승무원 면접 증명사진으로 편집.
// 구글 제미나이 이미지 편집("Nano Banana", gemini-2.5-flash-image). 원가 사진 1장당 수십 원 수준.
// 사진은 편집에만 사용하고 저장하지 않음.
const MODEL = 'gemini-2.5-flash-image';

function buildPrompt(o) {
  const airline = o.target === 'international'
    ? 'Styling should suit an international airline cabin-crew interview.'
    : 'Styling should suit a Korean domestic airline cabin-crew interview.';
  const hex = (v, d) => (/^#[0-9a-fA-F]{6}$/.test(v || '') ? v : d);
  const bgHexV = hex(o.bgHex, '#9CC3E8');
  const bgTone = (() => { const r = parseInt(bgHexV.substr(1, 2), 16), g = parseInt(bgHexV.substr(3, 2), 16), b = parseInt(bgHexV.substr(5, 2), 16); return (b > r + 12 && b >= g) ? ' (a fresh, clean, clearly BLUE sky-blue tone with a visible blue cast — definitely not gray or white)' : ''; })();
  const bg = `a perfectly flat, clean, evenly-lit solid studio background in the exact color ${bgHexV}${bgTone} — render this color true, bright and clean as a pure paint swatch of that exact hex; it must NOT look grayish, muddy, dull or desaturated, with NO gray tint, NO gradient, NO vignette, NO shadow and NO texture behind the person`;
  const jkStyleMap = {
    single: 'a well-fitted single-breasted tailored blazer with notch lapels',
    collarless: 'a fitted single-layer collarless blazer with structured shoulders and absolutely NO lapels, NO notch, and NO folded collar of any kind — the jacket front is one smooth continuous curved edge running from the shoulder seam down to a soft, wide round-scoop opening at the chest (like a modern Korean airline no-collar uniform jacket), exposing the top worn underneath in a clean oval shape; the edge is simply finished fabric, not a separate collar piece',
    double: 'a well-fitted double-breasted tailored blazer',
    vnotch: 'a tailored woven-twill cabin-crew uniform jacket copied EXACTLY from the second reference image (garment reference). Neckline: NO collar, NO lapels, NO notch lapels, NO cardigan-like V. The neck opening is a soft shallow rounded scoop that starts at the base of the neck at the shoulder line and curves down into a short vertical center opening at the upper chest — the two front panels are crisp and structured with a clean vertical edge, sit close to the neck, and show a lot of bare collarbone skin above them; only a small narrow panel of plain white round-neck blouse is visible in the center of the chest. The jacket must look crisp and tailored like an airline uniform jacket — NOT a knit, NOT a cardigan, NOT a wide plunging V-neck sweater'
  };
  const jkStyle = jkStyleMap[o.jacketStyle] || jkStyleMap.single;
  const jk = `${jkStyle} in the color ${hex(o.jacketHex, '#20304F')}`;
  const neckMap = {
    shirt: 'a white dress shirt with a clearly visible pointed collar (a proper collared shirt), worn under the jacket',
    round: 'a collarless white blouse with a plain smooth ROUND neckline — absolutely NO collar of any kind, a clean rounded neckline',
    highneck: 'a white blouse buttoned all the way up to a high, closed neckline covering the neck — modest high-neck style, no open collar',
    innertop: 'a simple elegant ivory round-neck inner top (a crisp woven blouse-style top with a smooth round neckline, no collar)'
  };
  const fabricNote = ' The inner garment must be a crisp, smooth WOVEN cotton/satin uniform-style blouse — NOT a knit, NOT a sweater, NOT a ribbed or stretchy jersey top, NOT a casual t-shirt.';
  let neck = neckMap[o.neckline] || neckMap.shirt;
  // V노치 유니폼 자켓은 카라 없는 자켓이므로 안쪽 블라우스도 카라 없이(카라 셔츠와 충돌 방지)
  if (o.jacketStyle === 'vnotch') neck = 'a small plain white woven round-neck blouse, only a narrow center panel of it visible between the jacket fronts exactly like in the reference image — NO shirt collar, NO collar points, NO lapels anywhere';
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
- Hair (ABSOLUTELY CRITICAL — must look like a flawless, salon-finished airline-crew hairstyle): the hair is swept smoothly back off the face, tightly and neatly groomed with a polished, glossy, hair-sprayed finish, and secured at the back of the head where it is COMPLETELY HIDDEN from the camera. Every single strand is neatly combed and controlled: NO loose strands, NO flyaways, NO baby hairs, NO frizz, NO wisps, NO sideburn strands, NO fuzzy or messy edges anywhere — especially around the ears, temples, hairline and nape. The hair on both sides is tucked cleanly and tightly BEHIND the ears, laid flat against the head with a crisp, sharp, clean outline, so BOTH ears are fully exposed and the area around and beside the ears is perfectly clean skin with nothing hanging or sticking out. The hairline along the forehead and temples is a crisp, smooth, clean line. In this front view there must be NO bun, NO knot, NO ponytail, NO hair clip, NO hair tie and NO hair lump visible anywhere — not on top of the head, not behind or beside the head, not beside the neck, not on the shoulders. The camera sees only a clean, smooth, swept-back hairline with a very slight, tidy rounded lift at the crown (smooth, not puffy, not messy). On BOTH sides of the neck there must be ONLY bare skin and the plain background — no hair bulge, no hair bump, no hair mass. No hair falls forward onto the neck, jaw, cheeks or shoulders. No center part; forehead, ears and jawline fully visible.
- Wardrobe (follow EXACTLY as described): ${jk}, and worn underneath it: ${neck}.${fabricNote} Render this exact collar/neckline style clearly and make it the visible neckline in the photo.
- Background: replace with ${bg} — match this background color exactly.
- Posture: straighten the shoulders and head slightly.

CRITICAL: Preserve the person's FACIAL IDENTITY — same face shape, eyes, nose and overall likeness, so it is unmistakably the same person. Do NOT turn them into a different person, and do NOT change ethnicity, age, or facial proportions. But DO transform the expression, posture, framing, hair, wardrobe and background exactly as instructed above — the identity stays, everything else becomes polished and formal.

${o.jacketStyle === 'vnotch' ? `IMAGE INPUTS: the FIRST image is the applicant photo to edit (keep THIS person's face). The SECOND image is a cropped GARMENT SHAPE REFERENCE ONLY (a jacket neckline close-up, no face). Copy ONLY the outline/cut of the jacket neckline and front panels from it. Do NOT copy its color (use the color specified above), do NOT copy its lighting, shading, shadows, skin or fabric texture, and it must have NO influence at all on the applicant's face, hair, skin tone or expression — the face must remain 100% the applicant from the FIRST image. The jacket must be evenly and brightly lit, a clean flat color with NO dark shadows, NO darkened edges, NO gradient shading and NO dirty dark patches anywhere on it.
` : ''}
Output exactly ONE single portrait photo containing exactly ONE person (the applicant) — never a collage, never two people, never a side-by-side or duplicated image. Output ONLY the edited photo image.`;
}

let _refCache = null;
async function loadJacketRef() {
  if (_refCache) return _refCache;
  try {
    const r = await fetch('https://www.wonderfulcrew.com/images/jacket-ref.png');
    if (!r.ok) return null;
    _refCache = Buffer.from(await r.arrayBuffer()).toString('base64');
    return _refCache;
  } catch (e) { return null; }
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
    jacketStyle: ['single', 'collarless', 'double', 'vnotch'].indexOf(body.jacketStyle) > -1 ? body.jacketStyle : 'single',
    neckline: ['shirt', 'round', 'highneck', 'innertop'].indexOf(body.neckline) > -1 ? body.neckline : 'shirt',
    makeup: (body.makeup && typeof body.makeup === 'object') ? body.makeup : null
  };

  // 순서 중요: 1번=지원자 사진, 2번=자켓 형태 참고 이미지(V노치일 때만)
  const inputParts = [{ text: buildPrompt(opts) }, { inline_data: { mime_type: mediaType, data: image } }];
  if (opts.jacketStyle === 'vnotch') {
    const ref = await loadJacketRef();
    if (ref) inputParts.push({ inline_data: { mime_type: 'image/png', data: ref } });
  }

  try {
    // 참고 이미지가 가로로 길어서 결과가 2인 가로 콜라주로 나온 적이 있어, V노치일 땐 출력 비율을 세로 3:4로 고정
    const call = (cfg) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts: inputParts }], generationConfig: cfg })
    });
    const baseCfg = { responseModalities: ['IMAGE'] };
    let r;
    if (opts.jacketStyle === 'vnotch') {
      r = await call({ ...baseCfg, imageConfig: { aspectRatio: '3:4' } });
      if (!r.ok) r = await call(baseCfg);
    } else {
      r = await call(baseCfg);
    }
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
