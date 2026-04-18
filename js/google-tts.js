// Google Cloud TTS 공통 모듈
// 모든 페이지에서 사용 가능
var _gcTtsAudio = null;

async function gcSpeak(text, lang, gender, onEnd) {
  // 이전 오디오 중지
  if (_gcTtsAudio) { try { _gcTtsAudio.pause(); } catch(e) {} _gcTtsAudio = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();

  // Google Cloud TTS 시도
  try {
    var res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.substring(0, 1000), lang: lang || 'en-GB', gender: gender || 'female' })
    });
    if (res.ok) {
      var data = await res.json();
      if (data.audioContent) {
        var audio = new Audio('data:audio/mp3;base64,' + data.audioContent);
        _gcTtsAudio = audio;
        audio.onended = function() { _gcTtsAudio = null; if (onEnd) onEnd(); };
        audio.onerror = function() { _gcTtsAudio = null; if (onEnd) onEnd(); };
        audio.play();
        return true;
      }
    }
  } catch(e) {}

  // 폴백: 브라우저 TTS
  if (!('speechSynthesis' in window)) { if (onEnd) onEnd(); return false; }
  var u = new SpeechSynthesisUtterance(text);
  u.lang = lang || 'en-US';
  u.rate = 0.9;
  u.pitch = gender === 'male' ? 0.85 : 1.05;
  var voices = window.speechSynthesis.getVoices();
  var filtered = voices.filter(function(v) { return v.lang === lang || v.lang.startsWith((lang || 'en').split('-')[0]); });
  if (filtered.length > 0) u.voice = filtered[0];
  u.onend = function() { if (onEnd) onEnd(); };
  u.onerror = function() { if (onEnd) onEnd(); };
  window.speechSynthesis.speak(u);
  return false;
}

function gcStop() {
  if (_gcTtsAudio) { try { _gcTtsAudio.pause(); } catch(e) {} _gcTtsAudio = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
