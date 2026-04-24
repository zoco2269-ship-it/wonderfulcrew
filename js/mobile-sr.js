// 모바일 SpeechRecognition shim v2
// Android/iOS Chrome 의 Web Speech API 는 불안정 (텍스트 누락·중복·auto-stop).
// 모바일에서는 MediaRecorder 로 녹음 → /api/stt (Google Cloud STT) 로 전사.
// 데스크톱은 네이티브 Web Speech API 그대로 사용.
(function(){
  if(!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  var isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
  if(!isMobile) return;

  // ===== TEMP 진단 배지 — 모바일 전용, 원인 파악 후 제거 예정 =====
  var _dbgBadge = null;
  var _dbgPin = '';  // 중요 에러는 상단에 고정
  function _render(){
    if(!_dbgBadge) return;
    var body = (_dbgBadge._log||[]).slice(0,18).join('\n');
    _dbgBadge.textContent = (_dbgPin ? '★ '+_dbgPin+'\n---\n' : '') + body;
  }
  function dbg(msg, pin){
    try{
      if(!_dbgBadge){
        _dbgBadge = document.createElement('div');
        _dbgBadge.id = '_msr_dbg';
        _dbgBadge.style.cssText = 'position:fixed;right:8px;top:60px;z-index:99999;max-width:60vw;max-height:40vh;overflow:hidden;padding:6px 8px;background:rgba(0,0,0,.82);color:#7CFFB2;font:10px/1.3 monospace;border-radius:6px;white-space:pre-wrap;pointer-events:none;';
        _dbgBadge._log = [];
        (document.body||document.documentElement).appendChild(_dbgBadge);
      }
      var t = new Date().toISOString().slice(14,19);
      _dbgBadge._log.unshift('['+t+'] '+msg);
      if(pin) _dbgPin = msg;
      _render();
    }catch(e){}
  }
  // ================================================================

  // 모든 onend 호출 전에 _manualStop=true 강제 — 페이지의 auto-restart 로직 차단
  // (모바일에선 MediaRecorder 가 gap 없이 연속 녹음하므로 재시작 불필요)
  function fireEnd(self){
    try { window._manualStop = true; } catch(e) {}
    if(self.onend) self.onend({});
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
  }

  MobileSR.prototype.start = function(){
    var self = this;
    self._aborted = false;
    self._chunks = [];
    dbg('start() → getUserMedia...');
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
      self._stream = stream;
      var tracks = stream.getAudioTracks();
      var tk = tracks[0];
      dbg('gUM ok: tracks='+tracks.length+' live='+(tk&&tk.readyState)+' muted='+(tk&&tk.muted));
      var mimeType = '';
      var candidates = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'];
      for(var i=0;i<candidates.length;i++){
        if(MediaRecorder.isTypeSupported(candidates[i])){ mimeType = candidates[i]; break; }
      }
      try {
        self._rec = mimeType ? new MediaRecorder(stream, {mimeType:mimeType}) : new MediaRecorder(stream);
      } catch(e) {
        dbg('MR ctor FAIL: '+e.message);
        try { stream.getTracks().forEach(function(t){t.stop();}); } catch(_){}
        if(self.onerror) self.onerror({error:'audio-capture', message:e.message});
        fireEnd(self);
        return;
      }
      self._mimeType = self._rec.mimeType || 'audio/webm';
      dbg('MR ok mime='+self._mimeType);
      self._rec.ondataavailable = function(e){
        if(e.data && e.data.size > 0){
          self._chunks.push(e.data);
          dbg('data ev size='+e.data.size+' total='+self._chunks.length);
        } else {
          dbg('data ev EMPTY');
        }
      };
      self._rec.onstop = function(){
        try { stream.getTracks().forEach(function(t){t.stop();}); } catch(e){}
        dbg('onstop chunks='+self._chunks.length);
        if(self._aborted){
          fireEnd(self);
          return;
        }
        self._transcribe();
      };
      self._rec.onerror = function(e){
        dbg('MR onerror '+((e&&e.error&&e.error.name)||'?'));
        if(self.onerror) self.onerror({error:'audio-capture', message:(e && e.error && e.error.message) || 'recorder error'});
      };
      self._rec.start(1000);
      dbg('MR start(1000) called, state='+self._rec.state);
      if(self.onstart) self.onstart({});
      if(self.onaudiostart) self.onaudiostart({});
      if(self.onspeechstart) self.onspeechstart({});
    }).catch(function(err){
      dbg('gUM FAIL '+(err&&err.name)+' '+(err&&err.message));
      var code = (err && err.name === 'NotAllowedError') ? 'not-allowed'
               : (err && err.name === 'NotFoundError') ? 'audio-capture'
               : 'service-not-allowed';
      if(self.onerror) self.onerror({error:code, message:(err && err.message) || ''});
      fireEnd(self);
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
        dbg('_transcribe: NO chunks → no-speech');
        fireEnd(self);
        return;
      }
      var blob = new Blob(self._chunks, {type: self._mimeType});
      dbg('_transcribe: blob='+blob.size+'B type='+self._mimeType);
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

      dbg('fetch /api/stt enc='+encoding+' b64='+base64.length);
      var t0 = Date.now();
      var res, rawText = '', data = null;
      try {
        res = await fetch('/api/stt', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            audio: base64,
            lang: self.lang || 'en-US',
            encoding: encoding,
            sampleRate: 48000
          })
        });
      } catch(fe) {
        dbg('fetch THREW '+((fe&&fe.message)||fe)+' ('+(Date.now()-t0)+'ms)', true);
        throw fe;
      }
      var dt = Date.now()-t0;
      try { rawText = await res.text(); } catch(_){}
      try { data = rawText ? JSON.parse(rawText) : null; } catch(_){}
      if(data){
        dbg('/api/stt '+res.status+' '+dt+'ms tx.len='+((data.transcript||'').length)+(data.error?' err='+String(data.error).slice(0,80):''), res.status!==200);
      } else {
        dbg('/api/stt '+res.status+' '+dt+'ms RAW='+rawText.slice(0,120), true);
      }
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
      dbg('_transcribe EXC '+((e&&e.message)||e), true);
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
