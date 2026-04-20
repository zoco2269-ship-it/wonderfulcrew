// Google Cloud TTS 공통 모듈
// 모든 페이지에서 사용 가능
var _gcTtsAudio = null;
var _gcTtsSeq = 0;
var _gcTtsAbort = null;

async function gcSpeak(text, lang, gender, onEnd) {
  // 이전 요청·오디오 완전 취소
  _gcTtsSeq++;
  var mySeq = _gcTtsSeq;
  if (_gcTtsAbort) { try { _gcTtsAbort.abort(); } catch(e) {} _gcTtsAbort = null; }
  if (_gcTtsAudio) { try { _gcTtsAudio.pause(); _gcTtsAudio.currentTime = 0; } catch(e) {} _gcTtsAudio = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();

  // Google Cloud TTS 시도 (3초 타임아웃)
  try {
    _gcTtsAbort = new AbortController();
    var timeout = setTimeout(function() { if (_gcTtsAbort) _gcTtsAbort.abort(); }, 3000);
    var res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.substring(0, 500), lang: lang || 'en-GB', gender: gender || 'female' }),
      signal: _gcTtsAbort.signal
    });
    clearTimeout(timeout);
    // 다른 호출이 들어왔으면 이 응답은 버림
    if (mySeq !== _gcTtsSeq) { if (onEnd) onEnd(); return false; }
    if (res.ok) {
      var data = await res.json();
      if (mySeq !== _gcTtsSeq) { if (onEnd) onEnd(); return false; }
      if (data.audioContent) {
        var audio = new Audio('data:audio/mp3;base64,' + data.audioContent);
        _gcTtsAudio = audio;
        audio.onended = function() { if (_gcTtsAudio === audio) { _gcTtsAudio = null; if (onEnd) onEnd(); } };
        audio.onerror = function() { if (_gcTtsAudio === audio) { _gcTtsAudio = null; if (onEnd) onEnd(); } };
        audio.play();
        return true;
      }
    }
  } catch(e) { if (e.name === 'AbortError') { if (onEnd) onEnd(); return false; } }

  if (mySeq !== _gcTtsSeq) { if (onEnd) onEnd(); return false; }

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
  _gcTtsSeq++;
  if (_gcTtsAbort) { try { _gcTtsAbort.abort(); } catch(e) {} _gcTtsAbort = null; }
  if (_gcTtsAudio) { try { _gcTtsAudio.pause(); _gcTtsAudio.currentTime = 0; } catch(e) {} _gcTtsAudio = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
