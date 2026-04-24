// 모바일 SpeechRecognition shim v3
// Android/iOS Chrome 의 Web Speech API 는 불안정 (텍스트 누락·중복·auto-stop).
// 모바일에서는 MediaRecorder 로 녹음 → /api/stt (Google Cloud STT) 로 전사.
// 데스크톱은 네이티브 Web Speech API 그대로 사용.
//
// 실시간 부분 전사(v3): 녹음 중 PARTIAL_INTERVAL_MS 마다 누적 오디오를 /api/stt 로 보내
//   isFinal=false 결과를 onresult 로 전달 → 페이지의 interim 표시 로직이 화면에 실시간 반영.
//   답변 완료 시 최종 전사(isFinal=true) 한 번 더 호출.
(function(){
  if(!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  var isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
  if(!isMobile) return;

  var PARTIAL_INTERVAL_MS = 3000;   // 3초마다 부분 전사
  var PARTIAL_MIN_CHUNKS = 2;        // 최소 2초 녹음된 뒤 시작 (1s timeslice 기준)

  function fireEnd(self){
    try { window._manualStop = true; } catch(e) {}
    if(self.onend) self.onend({});
  }

  function blobToBase64(blob){
    return new Promise(function(resolve, reject){
      var r = new FileReader();
      r.onloadend = function(){ resolve((r.result || '').split(',')[1] || ''); };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

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
    this._partialTimer = null;
    this._partialsDisabled = false;
    this._partialInFlight = false;
    this._lastPartial = '';
  }

  MobileSR.prototype._encoding = function(){
    if(this._mimeType && this._mimeType.indexOf('ogg') >= 0) return 'OGG_OPUS';
    if(this._mimeType && this._mimeType.indexOf('mp4') >= 0) return 'MP3';
    return 'WEBM_OPUS';
  };

  MobileSR.prototype._schedulePartial = function(){
    var self = this;
    if(self._partialsDisabled) return;
    self._partialTimer = setTimeout(function(){
      if(self._partialsDisabled) return;
      if(self._chunks.length < PARTIAL_MIN_CHUNKS || self._partialInFlight){
        self._schedulePartial();
        return;
      }
      self._partialInFlight = true;
      self._partialTranscribe().then(function(){
        self._partialInFlight = false;
        self._schedulePartial();
      }).catch(function(){
        self._partialInFlight = false;
        self._schedulePartial();
      });
    }, PARTIAL_INTERVAL_MS);
  };

  MobileSR.prototype._partialTranscribe = async function(){
    if(this._partialsDisabled || !this._chunks.length) return;
    var snapshot = this._chunks.slice();
    var blob = new Blob(snapshot, {type: this._mimeType});
    var base64 = await blobToBase64(blob);
    if(this._partialsDisabled) return;
    var res = await fetch('/api/stt', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        audio: base64,
        lang: this.lang || 'en-US',
        encoding: this._encoding(),
        sampleRate: 48000
      })
    });
    if(this._partialsDisabled) return;
    var data = null;
    try { data = await res.json(); } catch(e){ return; }
    var transcript = (data && data.transcript) ? String(data.transcript).trim() : '';
    if(this._partialsDisabled) return;
    if(transcript && transcript !== this._lastPartial && this.onresult){
      this._lastPartial = transcript;
      var fakeResult = { isFinal: false, length: 1, 0: { transcript: transcript, confidence: 0.8 } };
      var fakeResults = [fakeResult];
      fakeResults.length = 1;
      this.onresult({ results: fakeResults, resultIndex: 0 });
    }
  };

  MobileSR.prototype.start = function(){
    var self = this;
    self._aborted = false;
    self._chunks = [];
    self._partialsDisabled = false;
    self._partialInFlight = false;
    self._lastPartial = '';
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
        try { stream.getTracks().forEach(function(t){t.stop();}); } catch(_){}
        if(self.onerror) self.onerror({error:'audio-capture', message:e.message});
        fireEnd(self);
        return;
      }
      self._mimeType = self._rec.mimeType || 'audio/webm';
      self._rec.ondataavailable = function(e){
        if(e.data && e.data.size > 0) self._chunks.push(e.data);
      };
      self._rec.onstop = function(){
        try { stream.getTracks().forEach(function(t){t.stop();}); } catch(e){}
        // 부분 전사 중단 (final 과 경쟁 방지)
        self._partialsDisabled = true;
        if(self._partialTimer){ clearTimeout(self._partialTimer); self._partialTimer = null; }
        if(self._aborted){
          fireEnd(self);
          return;
        }
        self._transcribe();
      };
      self._rec.onerror = function(e){
        if(self.onerror) self.onerror({error:'audio-capture', message:(e && e.error && e.error.message) || 'recorder error'});
      };
      self._rec.start(1000);
      self._schedulePartial();
      if(self.onstart) self.onstart({});
      if(self.onaudiostart) self.onaudiostart({});
      if(self.onspeechstart) self.onspeechstart({});
    }).catch(function(err){
      var code = (err && err.name === 'NotAllowedError') ? 'not-allowed'
               : (err && err.name === 'NotFoundError') ? 'audio-capture'
               : 'service-not-allowed';
      if(self.onerror) self.onerror({error:code, message:(err && err.message) || ''});
      fireEnd(self);
    });
  };

  MobileSR.prototype.stop = function(){
    this._partialsDisabled = true;
    if(this._partialTimer){ clearTimeout(this._partialTimer); this._partialTimer = null; }
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
        fireEnd(self);
        return;
      }
      var blob = new Blob(self._chunks, {type: self._mimeType});
      var base64 = await blobToBase64(blob);
      var res = await fetch('/api/stt', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          audio: base64,
          lang: self.lang || 'en-US',
          encoding: self._encoding(),
          sampleRate: 48000
        })
      });
      var data = await res.json();
      var transcript = (data && data.transcript) ? String(data.transcript).trim() : '';
      if(transcript && self.onresult){
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
      fireEnd(self);
    }
  };

  // 네이티브 SR 교체
  window.SpeechRecognition = MobileSR;
  window.webkitSpeechRecognition = MobileSR;
  window._mobileSRActive = true;
})();
