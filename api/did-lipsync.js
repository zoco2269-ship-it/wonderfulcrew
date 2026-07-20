// D-ID Talks API 프록시 — 실사 이미지 + 텍스트 → 립싱크 mp4 URL 반환
// POST { text, gender?, imageUrl?, lang? } → { videoUrl }
// 환경변수 DID_API_KEY 필요 (Basic auth 형식으로 base64 encoded — D-ID 대시보드에서 발급)

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.DID_API_KEY;
  if (!key) return res.status(500).json({ error: 'DID_API_KEY not configured' });

  const { text, gender, imageUrl, lang } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text required' });

  // 기본 이미지 (사이트에 이미 존재하는 실사 인물 사진)
  const defaultImage = gender === 'male'
    ? 'https://www.wonderfulcrew.com/images/man-interviewer.png'
    : 'https://www.wonderfulcrew.com/images/woman-interviewer.png';
  const source = imageUrl || defaultImage;

  // Microsoft Neural voice mapping (D-ID 지원)
  const voiceMap = {
    'en-GB': { male: 'en-GB-RyanNeural', female: 'en-GB-SoniaNeural' },
    'en-US': { male: 'en-US-GuyNeural', female: 'en-US-JennyNeural' },
    'th-TH': { male: 'th-TH-NiwatNeural', female: 'th-TH-PremwadeeNeural' },
    'ko-KR': { male: 'ko-KR-InJoonNeural', female: 'ko-KR-SunHiNeural' }
  };
  const langKey = (lang && voiceMap[lang]) ? lang : 'en-GB';
  const voiceId = voiceMap[langKey][gender === 'male' ? 'male' : 'female'];

  try {
    // 1) Create talk
    const create = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_url: source,
        script: {
          type: 'text',
          subtitles: false,
          provider: { type: 'microsoft', voice_id: voiceId },
          input: text.substring(0, 500)
        },
        config: { fluent: true, pad_audio: 0.0, stitch: true }
      })
    });
    if (!create.ok) {
      const err = await create.json().catch(() => ({}));
      return res.status(create.status).json({ error: err.description || err.message || 'D-ID create failed', detail: err });
    }
    const createData = await create.json();
    const talkId = createData.id;
    if (!talkId) return res.status(500).json({ error: 'no talk id returned' });

    // 2) Poll until done (max ~45s)
    for (let i = 0; i < 45; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const poll = await fetch('https://api.d-id.com/talks/' + talkId, {
        headers: { 'Authorization': 'Basic ' + key }
      });
      if (!poll.ok) continue;
      const p = await poll.json();
      if (p.status === 'done' && p.result_url) {
        return res.json({ videoUrl: p.result_url, talkId: talkId });
      }
      if (p.status === 'error' || p.status === 'rejected') {
        return res.status(500).json({ error: p.error || 'D-ID processing failed', status: p.status });
      }
    }
    res.status(504).json({ error: 'D-ID timeout after 45s' });
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};
