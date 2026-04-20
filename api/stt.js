// Google Cloud Speech-to-Text fallback — 브라우저 SR 이 동작 안 할 때 사용
// 프론트엔드에서 MediaRecorder 로 녹음한 오디오(base64) 를 받아서 텍스트로 변환
module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { audio, lang, encoding, sampleRate } = req.body || {};
  if (!audio) return res.status(400).json({ error: 'audio required (base64)' });

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const langCode = lang || 'en-US';
  const enc = encoding || 'WEBM_OPUS';
  const rate = sampleRate || 48000;

  try {
    const response = await fetch(
      'https://speech.googleapis.com/v1/speech:recognize?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: enc,
            sampleRateHertz: rate,
            languageCode: langCode,
            enableAutomaticPunctuation: true,
            model: 'latest_long'
          },
          audio: { content: audio }
        })
      }
    );
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message || 'STT failed', raw: data });
    const transcript = (data.results || [])
      .map(r => (r.alternatives && r.alternatives[0] && r.alternatives[0].transcript) || '')
      .join(' ')
      .trim();
    return res.status(200).json({ transcript });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
