// 모바일 SpeechRecognition shim
// Android/iOS Chrome 의 Web Speech API 는 불안정 (텍스트 누락·중복·auto-stop).
// 모바일에서는 MediaRecorder 로 녹음 → /api/stt (Google Cloud STT) 로 전사.
// 데스크톱은 네이티브 Web Speech API 그대로 사용.
(function(){
  if(!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  var isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
  if(!isMobile) return;

  function MobileSR(){
    this.lang = 'en-US';
    this.interimResults = false;
    this.continuous = false;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.onstart = null;
    this.onaudiostart = null;
    this.onspeechstart = null;
    this._rec = null;
    this._chunks = [];
    this._stream = null;
    this._aborted = false;
  }

  MobileSR.prototype.start = function(){
    var self = this;
    self._aborted = false;
    self._chunks = [];
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
      self._stream = stream;
      var mimeType = '';
      var candidates = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'];
      for(var i=0;i<candidates.length;i++){
        if(MediaRecorder.isTypeSupported(candidates[i])){ mimeType = candidates[i]; break; }
      }
      try {
        self._rec = mimeType ? new MediaRecorder(stream, {mimeType:mimeType}) : new MediaRecorder(stream);
      } catch(e) {
        if(self.onerror) self.onerror({error:'audio-capture', message:e.message});
        if(self.onend) self.onend({});
        return;
      }
      self._mimeType = self._rec.mimeType || 'audio/webm';
      self._rec.ondataavailable = function(e){ if(e.data && e.data.size > 0) self._chunks.push(e.data); };
      self._rec.onstop = function(){
        try { stream.getTracks().forEach(function(t){t.stop();}); } catch(e){}
        if(self._aborted){
          if(self.onend) self.onend({});
          return;
        }
        self._transcribe();
      };
      self._rec.onerror = function(e){
        if(self.onerror) self.onerror({error:'audio-capture', message:(e && e.error && e.error.message) || 'recorder error'});
      };
      self._rec.start();
      if(self.onstart) self.onstart({});
      if(self.onaudiostart) self.onaudiostart({});
      if(self.onspeechstart) self.onspeechstart({});
    }).catch(function(err){
      var code = (err && err.name === 'NotAllowedError') ? 'not-allowed'
               : (err && err.name === 'NotFoundError') ? 'audio-capture'
               : 'service-not-allowed';
      if(self.onerror) self.onerror({error:code, message:(err && err.message) || ''});
      if(self.onend) self.onend({});
    });
  };

  MobileSR.prototype.stop = function(){
    try {
      if(this._rec && this._rec.state !== 'inactive') this._rec.stop();
    } catch(e) {}
  };

  MobileSR.prototype.abort = function(){
    this._aborted = true;
    this.stop();
  };

  MobileSR.prototype._transcribe = async function(){
    var self = this;
    try {
      if(!self._chunks.length){
        if(self.onend) self.onend({});
        return;
      }
      var blob = new Blob(self._chunks, {type: self._mimeType});
      // Blob → base64 (strip data-url prefix)
      var base64 = await new Promise(function(resolve, reject){
        var r = new FileReader();
        r.onloadend = function(){ resolve((r.result || '').split(',')[1] || ''); };
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      // encoding 추정 (mimeType 기준)
      var encoding = 'WEBM_OPUS';
      if(self._mimeType.indexOf('ogg') >= 0) encoding = 'OGG_OPUS';
      else if(self._mimeType.indexOf('mp4') >= 0) encoding = 'MP3'; // 근사 — Google 은 MP4/AAC 직접 지원 안 하지만 MP3 로 시도

      var res = await fetch('/api/stt', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          audio: base64,
          lang: self.lang || 'en-US',
          encoding: encoding,
          sampleRate: 48000
        })
      });
      var data = await res.json();
      var transcript = (data && data.transcript) ? String(data.transcript).trim() : '';
      if(transcript && self.onresult){
        // 가짜 SpeechRecognitionEvent — 페이지의 onresult 로직 호환
        var fakeResult = { isFinal: true, length: 1, 0: { transcript: transcript, confidence: 0.9 } };
        var fakeResults = [fakeResult];
        fakeResults.length = 1;
        self.onresult({ results: fakeResults, resultIndex: 0 });
      } else if(!transcript && self.onerror){
        self.onerror({error:'no-speech', message:'No speech detected'});
      }
    } catch(e) {
      if(self.onerror) self.onerror({error:'network', message:(e && e.message) || 'transcribe failed'});
    } finally {
      if(self.onend) self.onend({});
    }
  };

  // 네이티브 SR 교체
  window.SpeechRecognition = MobileSR;
  window.webkitSpeechRecognition = MobileSR;
  window._mobileSRActive = true;
})();
