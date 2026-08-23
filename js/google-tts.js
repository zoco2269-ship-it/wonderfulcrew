// Google Cloud TTS 공통 모듈
// 모든 페이지에서 사용 가능
var _gcTtsAudio = null;
var _gcTtsSeq = 0;
var _gcTtsAbort = null;

// 브라우저에 남는 음성 캐시 (IndexedDB) — 롤플레이/디스커션/파이널 질문처럼
// 고정된 문장을 다시 듣거나 다음에 또 연습할 때 구글 TTS를 다시 호출하지 않고 재사용.
// AI가 매번 새로 만드는 피드백 문장은 텍스트 자체가 매번 다르므로 캐시에 걸리지 않는다.
var _gcTtsDbPromise = null;
function _gcTtsDb() {
  if (_gcTtsDbPromise) return _gcTtsDbPromise;
  _gcTtsDbPromise = new Promise(function(resolve) {
    if (!('indexedDB' in window)) return resolve(null);
    try {
      var req = indexedDB.open('wc-tts-cache', 1);
      req.onupgradeneeded = function() { req.result.createObjectStore('audio'); };
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { resolve(null); };
    } catch(e) { resolve(null); }
  });
  return _gcTtsDbPromise;
}
async function _gcTtsCacheGet(key) {
  var db = await _gcTtsDb();
  if (!db) return null;
  return new Promise(function(resolve) {
    try {
      var tx = db.transaction('audio', 'readonly').objectStore('audio').get(key);
      tx.onsuccess = function() { resolve(tx.result || null); };
      tx.onerror = function() { resolve(null); };
    } catch(e) { resolve(null); }
  });
}
async function _gcTtsCacheSet(key, audioContent) {
  var db = await _gcTtsDb();
  if (!db) return;
  try { db.transaction('audio', 'readwrite').objectStore('audio').put(audioContent, key); } catch(e) {}
}

function _gcTtsPlay(audio, text, lang, gender, onEnd) {
  _gcTtsAudio = audio;
  audio.onended = function() { if (_gcTtsAudio === audio) { _gcTtsAudio = null; if (onEnd) onEnd(); } };
  audio.onerror = function() { if (_gcTtsAudio === audio) { _gcTtsAudio = null; if (onEnd) onEnd(); } };
  var _pp = audio.play();
  if (_pp && _pp.catch) { _pp.catch(function(err) {
    console.warn('[gcSpeak] audio.play blocked, falling back to speechSynthesis', err);
    if (_gcTtsAudio === audio) _gcTtsAudio = null;
    if ('speechSynthesis' in window) {
      try {
        var _u = new SpeechSynthesisUtterance(text);
        _u.lang = lang || 'en-GB';
        _u.rate = 0.9;
        _u.pitch = gender === 'male' ? 0.85 : 1.05;
        _u.onend = function() { if (onEnd) onEnd(); };
        _u.onerror = function() { if (onEnd) onEnd(); };
        window.speechSynthesis.speak(_u);
      } catch(e2) { if (onEnd) onEnd(); }
    } else if (onEnd) { onEnd(); }
  }); }
}

async function gcSpeak(text, lang, gender, onEnd) {
  // 이전 요청·오디오 완전 취소
  _gcTtsSeq++;
  var mySeq = _gcTtsSeq;
  if (_gcTtsAbort) { try { _gcTtsAbort.abort(); } catch(e) {} _gcTtsAbort = null; }
  if (_gcTtsAudio) { try { _gcTtsAudio.pause(); _gcTtsAudio.currentTime = 0; } catch(e) {} _gcTtsAudio = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();

  var trimmedText = text.substring(0, 500);
  var selLang = lang || 'en-GB';
  var selGender = gender || 'female';
  var cacheKey = trimmedText + '|' + selLang + '|' + selGender;

  // 캐시에 이미 있는 문장이면 네트워크 호출 없이 바로 재생
  try {
    var cachedAudio = await _gcTtsCacheGet(cacheKey);
    if (mySeq !== _gcTtsSeq) { if (onEnd) onEnd(); return false; }
    if (cachedAudio) {
      _gcTtsPlay(new Audio('data:audio/mp3;base64,' + cachedAudio), text, lang, gender, onEnd);
      return true;
    }
  } catch(e) {}

  // Google Cloud TTS 시도 (3초 타임아웃)
  try {
    _gcTtsAbort = new AbortController();
    var timeout = setTimeout(function() { if (_gcTtsAbort) _gcTtsAbort.abort(); }, 3000);
    var res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmedText, lang: selLang, gender: selGender }),
      signal: _gcTtsAbort.signal
    });
    clearTimeout(timeout);
    // 다른 호출이 들어왔으면 이 응답은 버림
    if (mySeq !== _gcTtsSeq) { if (onEnd) onEnd(); return false; }
    if (res.ok) {
      var data = await res.json();
      if (mySeq !== _gcTtsSeq) { if (onEnd) onEnd(); return false; }
      if (data.audioContent) {
        _gcTtsCacheSet(cacheKey, data.audioContent);
        _gcTtsPlay(new Audio('data:audio/mp3;base64,' + data.audioContent), text, lang, gender, onEnd);
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
