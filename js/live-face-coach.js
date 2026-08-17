/**
 * WonderfulCrew 실시간 얼굴 코칭 오버레이 (2026-08-17)
 * - 순수 additive: 기존 페이지 코드를 전혀 수정하지 않고 <script> 1줄로만 붙는다.
 * - 페이지가 카메라를 켜는 것을 밖에서 감시하다가, 비디오 오른쪽 빈 공간에 실시간 그래프 패널 표시.
 *   (공간 없으면 — 모바일 등 — 비디오 위 컴팩트 오버레이로 자동 전환)
 * - 어떤 단계에서든 실패하면 조용히 아무 것도 하지 않는다 (기존 기능 영향 0).
 * - 분석은 브라우저 내 MediaPipe FaceLandmarker + 자체 오디오 볼륨 측정 (서버·API 비용 0).
 */
(function(){
  'use strict';
  try {
    // 대상 페이지의 비디오 id — 여기 없는 페이지에선 즉시 종료
    var VIDEO_IDS = ['vid', 'cam-video'];

    var EN = false;
    try {
      EN = (document.documentElement && document.documentElement.lang === 'en') ||
           /-en(\.html)?$/.test(location.pathname || '');
    } catch(e) {}

    var MSG = EN ? {
      title: 'LIVE AI ANALYSIS',
      smile: 'Smile', gaze: 'Eye contact', tilt: 'Posture', voice: 'Voice',
      loading: 'Preparing analysis...',
      noFace: 'Keep your face in view',
      smileLow: '😊 Smile brighter!',
      gazeOff: '👀 Look at the camera',
      tiltOff: '📐 Keep your head straight',
      voiceLow: '🎙 Speak up a little',
      good: '✨ Great! Keep it up',
      bubbleLow: '😊 Lift those corners!',
      bubbleGood: '😊 Great smile!'
    } : {
      title: 'AI 실시간 분석',
      smile: '미소', gaze: '시선', tilt: '기울기', voice: '목소리',
      loading: '분석 준비 중...',
      noFace: '얼굴이 화면에 보이게 해주세요',
      smileLow: '😊 입꼬리 더 올려주세요!',
      gazeOff: '👀 시선을 카메라에 두세요',
      tiltOff: '📐 고개를 반듯하게',
      voiceLow: '🎙 목소리를 조금 더 크게',
      good: '✨ 아주 좋아요! 유지하세요',
      bubbleLow: '😊 입꼬리 올려주세요!',
      bubbleGood: '😊 미소 아주 좋아요!'
    };

    var videoEl = null, landmarker = null, loadingStarted = false, loadFailed = false;
    var box = null, msgEl = null, dotEl = null, mode = ''; // 'side' | 'over'
    var fills = {}, vals = {};
    var ema = { smile: null, gaze: null, tilt: null, voice: null };
    // 자체 오디오 볼륨 측정 (실패 시 목소리 바만 숨김 — 다른 기능 영향 X)
    var audioStream = null, analyser = null, audioBuf = null, audioFailed = false;

    function findVideo(){
      for (var i = 0; i < VIDEO_IDS.length; i++) {
        var v = document.getElementById(VIDEO_IDS[i]);
        if (v && v.tagName === 'VIDEO') return v;
      }
      return null;
    }

    function isLive(v){
      try {
        if (!v || !v.srcObject || v.readyState < 2 || !v.videoWidth) return false;
        var ts = v.srcObject.getVideoTracks ? v.srcObject.getVideoTracks() : [];
        for (var i = 0; i < ts.length; i++) if (ts[i].readyState === 'live') return true;
        return false;
      } catch(e) { return false; }
    }

    function barRow(key, label, big){
      var h = big ? 9 : 5, fs = big ? '0.78rem' : '0.68rem', lw = big ? 64 : 34;
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:' + (big ? 10 : 4) + 'px;">' +
        '<span style="font-size:' + fs + ';color:rgba(255,255,255,0.82);width:' + lw + 'px;flex-shrink:0;">' + label + '</span>' +
        '<div style="flex:1;height:' + h + 'px;border-radius:' + h + 'px;background:rgba(255,255,255,0.16);overflow:hidden;">' +
          '<div id="wcfc-f-' + key + '" style="height:100%;width:0%;border-radius:' + h + 'px;background:#5BD08A;transition:width .25s,background .25s;"></div>' +
        '</div>' +
        (big ? '<span id="wcfc-v-' + key + '" style="font-size:0.78rem;font-weight:800;color:#E8C96A;width:30px;text-align:right;flex-shrink:0;">–</span>' : '') +
      '</div>';
    }

    function buildOverlay(newMode){
      if (box && mode === newMode) return;
      if (box) { try { box.remove(); } catch(e) {} box = null; }
      mode = newMode;
      var big = (mode === 'side');
      box = document.createElement('div');
      box.id = 'wc-face-coach';
      box.style.cssText = 'position:fixed;z-index:9000;display:none;pointer-events:none;' +
        'background:rgba(16,22,42,0.88);backdrop-filter:blur(6px);border:1px solid rgba(201,168,76,0.45);' +
        'border-radius:14px;padding:' + (big ? '18px 20px' : '8px 12px') + ';' +
        'width:' + (big ? '280px' : '180px') + ';' +
        'font-family:"Noto Sans KR",sans-serif;box-shadow:0 8px 30px rgba(0,0,0,0.4);';
      box.innerHTML =
        '<div style="display:flex;align-items:center;gap:7px;margin-bottom:' + (big ? '14px' : '6px') + ';">' +
          '<span id="wcfc-dot" style="width:8px;height:8px;border-radius:50%;background:#E8524A;display:inline-block;"></span>' +
          '<span style="font-size:' + (big ? '0.74rem' : '0.66rem') + ';font-weight:800;letter-spacing:0.12em;color:#E8C96A;">' + MSG.title + '</span>' +
        '</div>' +
        barRow('smile', MSG.smile, big) +
        barRow('gaze', MSG.gaze, big) +
        barRow('tilt', MSG.tilt, big) +
        '<div id="wcfc-voicerow">' + barRow('voice', MSG.voice, big) + '</div>' +
        '<div id="wcfc-msg" style="font-size:' + (big ? '0.86rem' : '0.72rem') + ';font-weight:700;color:#fff;line-height:1.5;margin-top:' + (big ? '6px' : '2px') + ';"></div>';
      document.body.appendChild(box);
      ['smile','gaze','tilt','voice'].forEach(function(k){
        fills[k] = document.getElementById('wcfc-f-' + k);
        vals[k] = document.getElementById('wcfc-v-' + k);
      });
      msgEl = document.getElementById('wcfc-msg');
      dotEl = document.getElementById('wcfc-dot');
      if (audioFailed) { var vr = document.getElementById('wcfc-voicerow'); if (vr) vr.style.display = 'none'; }
    }

    // 입꼬리 옆 말풍선 — 녹화 영상에는 안 남는 화면 전용 레이어
    var bubble = null;
    function ensureBubble(){
      if (bubble) return;
      bubble = document.createElement('div');
      bubble.id = 'wc-face-bubble';
      bubble.style.cssText = 'position:fixed;z-index:9001;display:none;pointer-events:none;' +
        'font-family:"Noto Sans KR",sans-serif;font-size:0.78rem;font-weight:800;white-space:nowrap;' +
        'padding:6px 12px;border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,0.3);transition:opacity .2s;';
      document.body.appendChild(bubble);
    }
    function hideBubble(){ try { if (bubble) bubble.style.display = 'none'; } catch(e) {} }
    // 정규화 좌표(0~1) → 화면 픽셀 (object-fit:cover + scaleX(-1) 미러 반영)
    function mouthToScreen(nx, ny){
      try {
        var r = videoEl.getBoundingClientRect();
        var vw = videoEl.videoWidth, vh = videoEl.videoHeight;
        if (!vw || !vh || !r.width) return null;
        var scale = Math.max(r.width / vw, r.height / vh);
        var dw = vw * scale, dh = vh * scale;
        var ox = (dw - r.width) / 2, oy = (dh - r.height) / 2;
        var px = nx * dw - ox, py = ny * dh - oy;
        px = r.width - px; // 미러
        if (px < 0 || px > r.width || py < 0 || py > r.height) return null;
        return { x: r.left + px, y: r.top + py, rect: r };
      } catch(e) { return null; }
    }
    function updateBubble(lm, smileVal){
      try {
        ensureBubble();
        var good = smileVal >= 60, low = smileVal < 40;
        if ((!good && !low) || !lm || !lm[13]) { hideBubble(); return; }
        var p = mouthToScreen(lm[13].x, lm[13].y);
        if (!p) { hideBubble(); return; }
        bubble.textContent = good ? MSG.bubbleGood : MSG.bubbleLow;
        bubble.style.background = good ? 'rgba(91,208,138,0.95)' : 'rgba(244,178,62,0.95)';
        bubble.style.color = good ? '#0d3320' : '#3a2402';
        var bw = bubble.offsetWidth || 150, bhh = bubble.offsetHeight || 30;
        bubble.style.left = Math.round(p.rect.left + (p.rect.width - bw) / 2) + 'px';
        if (p.rect.width < 420) {
          // 작은 화면(스몰톡): 영상 바로 아래 — 다크 배경 위라 눈에 잘 띔
          bubble.style.top = Math.round(p.rect.top + p.rect.height + 6) + 'px';
        } else {
          // 큰 화면(비디오면접): 영상 "안쪽" 중간 하단 (얼굴 아래) — 아래 버튼들과 안 겹침
          bubble.style.top = Math.round(p.rect.top + p.rect.height - bhh - 14) + 'px';
        }
        bubble.style.display = 'block';
      } catch(e) {}
    }

    // 깜빡이는 점 (전역 1개 타이머)
    setInterval(function(){
      try { if (dotEl) dotEl.style.opacity = (dotEl.style.opacity === '0.25') ? '1' : '0.25'; } catch(e) {}
    }, 700);

    function pickModeAndPosition(){
      try {
        var r = videoEl.getBoundingClientRect();
        if (r.width < 40 || r.height < 40 || r.bottom < 60 || r.top > window.innerHeight - 60) {
          if (box) box.style.display = 'none';
          return false;
        }
        var spaceRight = window.innerWidth - r.right;
        var wantMode = spaceRight >= 320 ? 'side' : 'over';
        buildOverlay(wantMode);
        if (wantMode === 'side') {
          box.style.left = Math.round(r.right + 24) + 'px';
          box.style.top = Math.round(Math.max(8, Math.min(r.top + 4, window.innerHeight - (box.offsetHeight || 260) - 8))) + 'px';
        } else {
          box.style.left = Math.round(r.left + 8) + 'px';
          box.style.top = Math.round(Math.max(r.top + 8, r.bottom - (box.offsetHeight || 110) - 8)) + 'px';
        }
        return true;
      } catch(e) { return false; }
    }

    function barColor(v){ return v >= 60 ? '#5BD08A' : (v >= 40 ? '#F4B23E' : '#E8524A'); }

    function setBar(key, v){
      try {
        if (!fills[key]) return;
        var n = Math.round(v);
        fills[key].style.width = n + '%';
        fills[key].style.background = barColor(n);
        if (vals[key]) vals[key].textContent = n;
      } catch(e) {}
    }

    var loadAttempts = 0;
    // ★ 격리 iframe 안에서 tasks-vision 로딩 — 페이지의 구버전 @mediapipe/face_mesh(전역 Module 오염)와
    //   같은 전역에서 초기화되면 "Module.arguments has been replaced" abort 로 랜덤 실패 (스몰톡에서 재현·확정).
    //   iframe 은 별도 전역이라 충돌 원천 차단. landmarker 객체는 부모에서 그대로 호출 가능.
    var lmFrame = null;
    function createLandmarkerIsolated(){
      return new Promise(function(resolve, reject){
        try {
          if (lmFrame && lmFrame.parentNode) lmFrame.parentNode.removeChild(lmFrame);
          lmFrame = document.createElement('iframe');
          lmFrame.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden;';
          lmFrame.setAttribute('aria-hidden', 'true');
          var timer = setTimeout(function(){ reject(new Error('lm-frame timeout')); }, 45000);
          document.body.appendChild(lmFrame);
          // src 없는 same-origin iframe 은 append 직후 바로 접근 가능
          setTimeout(function(){
            try {
              var w = lmFrame.contentWindow, d = lmFrame.contentDocument;
              if (!w || !d || !d.body) { clearTimeout(timer); reject(new Error('lm-frame doc')); return; }
              w.__lmDone = function(lm){ clearTimeout(timer); resolve(lm); };
              w.__lmFail = function(e){ clearTimeout(timer); reject(e); };
              var sc = d.createElement('script');
              sc.type = 'module';
              sc.textContent =
                "import { FaceLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/vision_bundle.mjs';\n" +
                "(async function(){\n" +
                "  try {\n" +
                "    const fs = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm');\n" +
                "    const opts = gpu => ({ baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', delegate: gpu ? 'GPU' : undefined }, runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true });\n" +
                "    let lm; try { lm = await FaceLandmarker.createFromOptions(fs, opts(true)); } catch(e) { lm = await FaceLandmarker.createFromOptions(fs, opts(false)); }\n" +
                "    window.__lmDone(lm);\n" +
                "  } catch(e) { window.__lmFail(e); }\n" +
                "})();";
              d.body.appendChild(sc);
            } catch(e) { clearTimeout(timer); reject(e); }
          }, 0);
        } catch(e) { reject(e); }
      });
    }
    function ensureLandmarker(){
      if (landmarker || loadingStarted || loadFailed) return;
      if (!document.body) return;
      loadingStarted = true;
      loadAttempts++;
      createLandmarkerIsolated()
        .then(function(lm){ landmarker = lm; })
        .catch(function(){
          // 일시 네트워크·GPU 실패 대비 자동 재시도 (4초 간격, 최대 5회 후 패널 숨김)
          if (loadAttempts >= 5) { loadFailed = true; if (box) box.style.display = 'none'; hideBubble(); }
          else setTimeout(function(){ loadingStarted = false; }, 4000);
        });
    }

    function ensureAudio(){
      if (analyser || audioFailed || audioStream === 'pending') return;
      audioStream = 'pending';
      try {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function(st){
          try {
            audioStream = st;
            var AC = window.AudioContext || window.webkitAudioContext;
            var ac = new AC();
            var src = ac.createMediaStreamSource(st);
            analyser = ac.createAnalyser();
            analyser.fftSize = 512;
            src.connect(analyser);
            audioBuf = new Uint8Array(analyser.frequencyBinCount);
          } catch(e) { audioFailed = true; stopAudio(); }
        }).catch(function(){ audioFailed = true; audioStream = null; hideVoiceRow(); });
      } catch(e) { audioFailed = true; audioStream = null; hideVoiceRow(); }
    }

    function hideVoiceRow(){
      try { var vr = document.getElementById('wcfc-voicerow'); if (vr) vr.style.display = 'none'; } catch(e) {}
    }

    function stopAudio(){
      try {
        if (audioStream && audioStream !== 'pending' && audioStream.getTracks) {
          audioStream.getTracks().forEach(function(t){ try { t.stop(); } catch(e) {} });
        }
      } catch(e) {}
      audioStream = null; analyser = null; audioBuf = null;
    }

    function voiceScore(){
      try {
        if (!analyser || !audioBuf) return null;
        analyser.getByteFrequencyData(audioBuf);
        var sum = 0;
        for (var i = 0; i < audioBuf.length; i++) sum += audioBuf[i];
        var avg = sum / audioBuf.length; // 0~255, 일반 발화 시 ~20-60
        return Math.max(0, Math.min(100, Math.round(avg * 2.2)));
      } catch(e) { return null; }
    }

    function analyze(){
      try {
        if (!box || box.style.display === 'none' || !isLive(videoEl)) return;
        if (!landmarker) {
          // 모델 로딩 중 표시 — 값 없이 조용히 죽은 것처럼 보이는 상태 방지
          if (msgEl && !loadFailed) msgEl.textContent = MSG.loading;
          return;
        }
        var res = landmarker.detectForVideo(videoEl, performance.now());
        if (!res || !res.faceBlendshapes || !res.faceBlendshapes[0]) {
          if (msgEl) msgEl.textContent = MSG.noFace;
          setBar('smile', 0); setBar('gaze', 0); setBar('tilt', 0);
          hideBubble();
          return;
        }
        var b = {};
        res.faceBlendshapes[0].categories.forEach(function(c){ b[c.categoryName] = c.score; });
        // interview-check 와 동일한 산식 (미소·시선)
        var smile = Math.max(0, Math.min(100, ((b.mouthSmileLeft || 0) + (b.mouthSmileRight || 0)) / 2 * 150));
        var gazeRaw = Math.max(b.eyeLookInLeft||0, b.eyeLookOutLeft||0, b.eyeLookInRight||0, b.eyeLookOutRight||0,
                               b.eyeLookUpLeft||0, b.eyeLookDownLeft||0, b.eyeLookUpRight||0, b.eyeLookDownRight||0);
        var gaze = Math.max(0, Math.min(100, 100 * (1 - Math.max(0, gazeRaw - 0.2) / 0.4)));
        // 기울기 — 양쪽 눈꼬리 landmark(33, 263) 의 수평 각도
        var tilt = 100;
        try {
          var lm = res.faceLandmarks && res.faceLandmarks[0];
          if (lm && lm[33] && lm[263]) {
            var dx = lm[263].x - lm[33].x, dy = lm[263].y - lm[33].y;
            var deg = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
            if (deg > 90) deg = Math.abs(180 - deg);
            tilt = Math.max(0, Math.min(100, 100 - Math.max(0, deg - 3) * 9));
          }
        } catch(e) {}
        var vs = voiceScore();

        ema.smile = (ema.smile == null) ? smile : (ema.smile * 0.6 + smile * 0.4);
        ema.gaze = (ema.gaze == null) ? gaze : (ema.gaze * 0.6 + gaze * 0.4);
        ema.tilt = (ema.tilt == null) ? tilt : (ema.tilt * 0.6 + tilt * 0.4);
        if (vs != null) ema.voice = (ema.voice == null) ? vs : (ema.voice * 0.7 + vs * 0.3);

        setBar('smile', ema.smile); setBar('gaze', ema.gaze); setBar('tilt', ema.tilt);
        if (ema.voice != null) setBar('voice', ema.voice);
        updateBubble(res.faceLandmarks && res.faceLandmarks[0], Math.round(ema.smile));

        if (msgEl) {
          var s = Math.round(ema.smile), g = Math.round(ema.gaze), t = Math.round(ema.tilt);
          if (s < 40) msgEl.textContent = MSG.smileLow;
          else if (g < 55) msgEl.textContent = MSG.gazeOff;
          else if (t < 55) msgEl.textContent = MSG.tiltOff;
          else if (ema.voice != null && ema.voice < 20) msgEl.textContent = MSG.voiceLow;
          else msgEl.textContent = MSG.good;
        }
      } catch(e) {}
    }

    // 메인 감시 루프 — 카메라 꺼져 있으면 조용히 대기, 켜지면 패널 표시
    var analyzeTimer = null;
    setInterval(function(){
      try {
        if (!videoEl) videoEl = findVideo();
        if (!videoEl) return;
        if (isLive(videoEl)) {
          ensureLandmarker();
          ensureAudio();
          if (pickModeAndPosition()) box.style.display = 'block';
          if (!analyzeTimer) analyzeTimer = setInterval(analyze, 350);
        } else {
          if (box) box.style.display = 'none';
          hideBubble();
          if (analyzeTimer) { clearInterval(analyzeTimer); analyzeTimer = null; }
          ema = { smile: null, gaze: null, tilt: null, voice: null };
          if (analyser) stopAudio();
        }
      } catch(e) {}
    }, 500);
  } catch(e) { /* 어떤 오류도 밖으로 새지 않게 — 기존 페이지 보호 */ }
})();
