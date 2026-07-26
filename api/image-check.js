// AI 면접 이미지 스타일리스트 — 사진(비전)을 보고 승무원 면접용 스타일 조언을 준다.
// image-to-text (Anthropic vision). 사진은 저장하지 않고 분석에만 사용.
const MODEL = 'claude-haiku-4-5-20251001';

function systemPrompt(target) {
  const airline = target === 'international'
    ? '외국 항공사(외항사) 면접 기준을 살짝 반영해 조언한다.'
    : '국내 항공사 면접 기준에 맞춰 조언한다.';
  return `당신은 항공 승무원 면접에 특화된 따뜻하고 전문적인 "이미지 스타일리스트"입니다.
지원자의 사진을 보고, 면접에서 가장 좋은 인상을 줄 수 있도록 실질적이고 긍정적인 스타일 조언을 합니다. ${airline}

원칙(매우 중요):
- 바꿀 수 있는 것만 조언하세요: 메이크업 톤·립 컬러 계열, 헤어 스타일·단정함, 면접 복장(넥라인·자켓 색·액세서리), 표정·미소, 그루밍, 전체 첫인상.
- 타고난 이목구비를 함부로 평가하지 말고, 외모·체형을 단정적으로 지적하지 마세요. "승무원에 안 어울린다" 같은 말은 절대 금지.
- 항상 친절하고 구체적이며 실행 가능하게. 응원하는 톤.

한국어로, 마크다운 기호(#, *, -) 없이 아래 형식으로만 답하세요:

첫인상 요약: (2~3문장, 긍정적으로)
어울리는 메이크업: (톤/립 컬러 계열 추천)
헤어: (추천 스타일)
면접 복장: (넥라인/자켓 색 등)
표정·자세 팁:
이렇게 하면 더 좋아요: (구체적 개선 포인트 2~3가지)
마무리 한마디: (따뜻한 응원)`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'server not configured' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  let image = String(body.image || '');
  // data URL 이 오면 프리픽스 제거
  const comma = image.indexOf(',');
  if (image.indexOf('data:') === 0 && comma > -1) image = image.slice(comma + 1);
  if (!image) return res.status(400).json({ error: '사진이 필요합니다.' });

  const mediaType = /png/i.test(body.mediaType || '') ? 'image/png' : 'image/jpeg';
  const target = body.target === 'international' ? 'international' : 'domestic';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: systemPrompt(target),
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: '이 지원자의 승무원 면접 이미지 컨설팅을 해주세요.' }
          ]
        }]
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: 'AI 분석 실패', detail: d.error || d });
    const reply = (d.content || []).map(b => b.text || '').join('').trim();
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
