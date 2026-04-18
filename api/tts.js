module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { text, lang, gender } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text required' });

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'TTS API key not configured' });

  // 액센트별 최적 음성 매핑
  const voiceMap = {
    'en-GB': { male: 'en-GB-Neural2-D', female: 'en-GB-Neural2-C', lang: 'en-GB' },
    'en-US': { male: 'en-US-Neural2-J', female: 'en-US-Neural2-F', lang: 'en-US' },
    'en-IN': { male: 'en-IN-Neural2-B', female: 'en-IN-Neural2-A', lang: 'en-IN' },
    'en-PH': { male: 'fil-PH-Neural2-D', female: 'fil-PH-Neural2-A', lang: 'fil-PH' },
    'en-SG': { male: 'cmn-CN-Neural2-B', female: 'cmn-CN-Neural2-A', lang: 'cmn-CN' },
    'es-ES': { male: 'es-ES-Neural2-B', female: 'es-ES-Neural2-C', lang: 'es-ES' },
    'fr-FR': { male: 'fr-FR-Neural2-B', female: 'fr-FR-Neural2-A', lang: 'fr-FR' },
    'ko-KR': { male: 'ko-KR-Neural2-C', female: 'ko-KR-Neural2-A', lang: 'ko-KR' }
  };

  const selectedLang = lang || 'en-GB';
  const selectedGender = gender || 'female';
  const voiceConfig = voiceMap[selectedLang] || voiceMap['en-GB'];
  const voiceName = selectedGender === 'male' ? voiceConfig.male : voiceConfig.female;
  const langCode = voiceConfig.lang || selectedLang;

  try {
    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: text.substring(0, 1000) },
          voice: {
            languageCode: langCode,
            name: voiceName
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.92,
            pitch: 0
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'TTS failed' });
    }

    const data = await response.json();
    res.json({ audioContent: data.audioContent });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
