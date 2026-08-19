/* ============================================================
   live-avatar.js — 사진 1장으로 "살아있는" 스피킹 캐릭터
   비용 0원: 외부 API 없음, 순수 CSS/JS.
   - 미세 숨쉬기 + 자연스러운 흔들림
   - 눈 깜빡임(피부톤 눈꺼풀 오버레이, 랜덤 간격)
   - 말하는 중 입 움직임(TTS on/off 동기, 립싱크 아님)
   - 눈/입 위치: 고정 비율 추정 + 사용자 미세조정(클릭/슬라이더)
   사용:
     var av = LiveAvatar.mount(containerEl, imageUrl);
     av.speak();  // 말하기 시작(입 움직임 on)
     av.stop();   // 말하기 끝(입 off)
   ============================================================ */
(function(global){
  function el(tag, css, parent){ var d=document.createElement(tag); if(css)d.style.cssText=css; if(parent)parent.appendChild(d); return d; }

  function LiveAvatar(container, imageUrl, opts){
    opts = opts || {};
    this.container = container;
    // 얼굴 비율(0~1) — 정면 상반신 기준 기본값
    this.cfg = { eyeY:0.35, eyeX:0.50, eyeGap:0.105, eyeW:0.085, eyeH:0.042,
                 mouthY:0.53, mouthX:0.50, mouthW:0.12, mouthH:0.05,
                 skin: opts.skin || 'rgba(232,204,180,0.0)' };
    this._speaking=false; this._timers=[]; this._blinkTO=null;
    this._build(imageUrl);
  }
  LiveAvatar.prototype._build=function(imageUrl){
    var c=this.container;
    c.style.position='relative'; c.style.overflow='hidden';
    // 무대(살짝 움직이는 래퍼)
    var stage=el('div','position:absolute;inset:0;transform-origin:50% 80%;will-change:transform;',c);
    this.stage=stage;
    // 얼굴 사진
    var img=el('img','position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;',stage);
    img.src=imageUrl; this.img=img;
    // 눈꺼풀 2개 (깜빡임) — 피부톤 그라데이션, 평소 높이 0
    this.lidL=el('div','display:none;',stage);
    this.lidR=el('div','display:none;',stage);
    // 입 그림자 오버레이 (말할 때 위아래 스케일)
    this.mouth=el('div','position:absolute;pointer-events:none;opacity:0;',stage);
    // 살짝 어두워지는 비네트(생동감)
    el('div','position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 60px rgba(0,0,0,0.06);',stage);
    this._layout();
    this._startBreath();
    this._scheduleBlink();
    var self=this; window.addEventListener('resize',function(){self._layout();});
  };
  LiveAvatar.prototype._layout=function(){
    var w=this.container.clientWidth||300, h=this.container.clientHeight||300, cf=this.cfg;
    function set(node,cx,cy,ew,eh){ node.style.left=((cx-ew/2)*w)+'px'; node.style.top=((cy-eh/2)*h)+'px'; node.style.width=(ew*w)+'px'; node.style.height=(eh*h)+'px'; }
    set(this.lidL, cf.eyeX-cf.eyeGap, cf.eyeY, cf.eyeW, cf.eyeH);
    set(this.lidR, cf.eyeX+cf.eyeGap, cf.eyeY, cf.eyeW, cf.eyeH);
    set(this.mouth, cf.mouthX, cf.mouthY, cf.mouthW, cf.mouthH);
  };
  LiveAvatar.prototype._startBreath=function(){
    // CSS keyframes 주입(1회)
    if(!document.getElementById('la-kf')){
      var st=document.createElement('style'); st.id='la-kf';
      st.textContent='@keyframes laBreath{0%{transform:scale(1) translateY(0)}50%{transform:scale(1.006) translateY(-0.15%)}100%{transform:scale(1) translateY(0)}}'+
        '@keyframes laTalk{0%{transform:scale(1) translateY(0)}50%{transform:scale(1.012) translateY(-0.35%)}100%{transform:scale(1) translateY(0)}}';
      document.head.appendChild(st);
    }
    this.stage.style.animation='laBreath 4s ease-in-out infinite';
  };
  LiveAvatar.prototype._scheduleBlink=function(){
    var self=this;
    var next=1800+Math.random()*3200; // 2~5초
    this._blinkTO=setTimeout(function(){ self._blink(); self._scheduleBlink(); }, next);
  };
  LiveAvatar.prototype._blink=function(){
    var self=this;
    this.lidL.style.transform='scaleY(1)'; this.lidR.style.transform='scaleY(1)';
    setTimeout(function(){ self.lidL.style.transform='scaleY(0)'; self.lidR.style.transform='scaleY(0)'; },140);
    // 가끔 두 번 깜빡
    if(Math.random()<0.25){ setTimeout(function(){ self._blink(); },420); }
  };
  LiveAvatar.prototype.speak=function(){
    if(this._speaking) return; this._speaking=true;
    /* 입 그림자 없이 — 말할 때 화면(전체)만 살짝 움직임 */
    this.stage.style.animation='laTalk 2.6s ease-in-out infinite';
  };
  LiveAvatar.prototype.stop=function(){
    this._speaking=false;
    this.stage.style.animation='laBreath 4s ease-in-out infinite';
    if(this._mouthIv){ clearInterval(this._mouthIv); this._mouthIv=null; }
  };
  LiveAvatar.prototype.setImage=function(url){ this.img.src=url; };
  LiveAvatar.prototype.tune=function(partial){ Object.assign(this.cfg,partial); this._layout(); };
  LiveAvatar.prototype.destroy=function(){ if(this._blinkTO)clearTimeout(this._blinkTO); if(this._mouthIv)clearInterval(this._mouthIv); this.container.innerHTML=''; };

  global.LiveAvatar = {
    mount: function(container, imageUrl, opts){ return new LiveAvatar(container, imageUrl, opts); }
  };
})(window);
