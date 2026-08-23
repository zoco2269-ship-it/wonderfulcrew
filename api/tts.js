// 동일 문장(고정 멘트) 반복 요청 시 구글 API 재호출을 막는 메모리 캐시.
// 서버리스 인스턴스가 살아있는 동안(warm)만 유지되지만, 롤플레이/디스커션/파이널 질문처럼
// 정해진 문장 풀을 여러 사용자가 반복해서 듣는 구조에서는 중복 호출을 크게 줄여준다.
const _ttsCache = new Map();
const TTS_CACHE_MAX = 500;

function _ttsCacheGet(key) {
  const hit = _ttsCache.get(key);
  if (hit) { _ttsCache.delete(key); _ttsCache.set(key, hit); } // LRU touch
  return hit;
}

function _ttsCacheSet(key, value) {
  if (_ttsCache.size >= TTS_CACHE_MAX) {
    const oldest = _ttsCache.keys().next().value;
    _ttsCache.delete(oldest);
  }
  _ttsCache.set(key, value);
}

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
    'ko-KR': { male: 'ko-KR-Wavenet-D', female: 'ko-KR-Wavenet-B', lang: 'ko-KR' },
    'th-TH': { male: 'th-TH-Neural2-C', female: 'th-TH-Neural2-C', lang: 'th-TH' }
  };

  const selectedLang = lang || 'en-GB';
  const selectedGender = gender || 'female';
  const voiceConfig = voiceMap[selectedLang] || voiceMap['en-GB'];
  const voiceName = selectedGender === 'male' ? voiceConfig.male : voiceConfig.female;
  const langCode = voiceConfig.lang || selectedLang;
  const trimmedText = text.substring(0, 1000);
  const cacheKey = trimmedText + '|' + langCode + '|' + voiceName;

  const cached = _ttsCacheGet(cacheKey);
  if (cached) return res.json({ audioContent: cached });

  try {
    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: trimmedText },
          voice: {
            languageCode: langCode,
            name: voiceName
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.08,
            // Google TTS Thai 는 여성 voice 만 지원 — 남성 요청 시 pitch 낮춰 흉내
            pitch: (selectedLang === 'th-TH' && selectedGender === 'male') ? -6.0 : 0
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'TTS failed' });
    }

    const data = await response.json();
    if (data.audioContent) _ttsCacheSet(cacheKey, data.audioContent);
    res.json({ audioContent: data.audioContent });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
