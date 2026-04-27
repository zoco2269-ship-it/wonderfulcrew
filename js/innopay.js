/**
 * WonderfulCrew 이노페이 결제 호출
 *
 * 사용법:
 *   payWithInnopay('basic')          // 베이직 월정액
 *   payWithInnopay('elite')          // 엘리트 월정액
 *   payWithInnopay('premium')        // 프리미엄 2년
 *   payWithInnopay('basic', { buyerName: '홍길동', buyerEmail: 'test@test.com', buyerTel: '01012345678' })
 */

/**
 * 가상계좌(무통장입금) 결제
 *   payWithVbank('basic')
 *   payWithVbank('elite')
 */
async function payWithVbank(plan, buyerInfo) {
  return payWithInnopay(plan, buyerInfo, 'VBANK');
}

async function payWithInnopay(plan, buyerInfo, payMethod) {
  try {
    // 로그인된 사용자 정보 자동 추출 — 어드민이 직접 입력할 필요 X
    var wcUser = {};
    try { wcUser = JSON.parse(localStorage.getItem('wc_user') || '{}'); } catch(e) {}
    // 1. 서버에서 결제 파라미터 준비
    var res = await fetch('/api/innopay-prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: plan || 'basic',
        userId: wcUser.id || '',
        buyerName: (buyerInfo && buyerInfo.buyerName) || wcUser.name || '',
        buyerEmail: (buyerInfo && buyerInfo.buyerEmail) || wcUser.email || '',
        buyerTel: (buyerInfo && buyerInfo.buyerTel) || '',
      }),
    });

    var data = await res.json();
    if (data.error) {
      alert('결제 준비 실패: ' + data.error);
      return;
    }

    // 2. 이노페이 결제창 호출
    if (typeof innopay === 'undefined' || !innopay.goPay) {
      alert('결제 모듈 로드 중입니다. 3초 후 다시 시도해주세요.');
      return;
    }

    // 이노페이 SDK 내부 로직: ih > window.innerHeight 이면 ih를 강제로 600으로 재설정하고 잘림.
    // 따라서 반드시 ih ≤ window.innerHeight 이어야 함.
    // iw도 동일 규칙: iw > window.innerWidth 이면 iw=422로 재설정됨.
    var maxH=window.innerHeight-20; // 여유 20px
    ih=Math.max(680, Math.min(maxH, 920)); // 680(Innopay 기본)~920 범위에서 viewport에 맞춤
    if(typeof iw!=='undefined'){
      var maxW=window.innerWidth-20;
      iw=Math.max(680, Math.min(maxW, 820));
    }
    innopay.goPay({
      PayMethod: payMethod || 'CARD',
      MID: data.mid,
      MerchantKey: data.merchantKey,
      GoodsName: data.goodsName,   // 상품명
      Amt: data.amount.toString(),  // 결제금액
      Moid: data.moid,             // 주문번호
      BuyerName: data.buyerName || (function(){try{var u=JSON.parse(localStorage.getItem('wc_user')||'{}');return u.name||u.email||'Guest';}catch(e){return 'Guest';}})(),
      BuyerEmail: data.buyerEmail || (function(){try{return JSON.parse(localStorage.getItem('wc_user')||'{}').email||'guest@wonderfulcrew.com';}catch(e){return 'guest@wonderfulcrew.com';}})(),
      BuyerTel: data.buyerTel || '01000000000',
      ReturnURL: data.returnUrl,   // 인증 완료 후 서버 콜백
      Signature: data.signature,
      Timestamp: data.timestamp,
    });

    // === 결제창 잘림 강제 우회 ===
    // Innopay SDK가 desktop에서 div height를 viewport보다 작게 강제하므로
    // 모달 생성 후 popWrapper에 overflow:auto, divpop은 auto height로 덮어씀.
    // 그러면 사용자가 페이지 자체를 스크롤하여 결제창 하단(취소/다음)까지 볼 수 있음.
    setTimeout(function(){
      try{
        var wrap=document.querySelector('.popWrapper');
        var divpop=document.getElementById('divpop');
        var iframe=document.getElementById('InnoFrame');
        if(wrap){
          wrap.style.cssText+=';overflow-y:auto !important;padding:0 !important;margin:0 !important;display:block !important;';
          wrap.scrollTop=0;
        }
        if(divpop){
          // popWrapper(position:fixed, top:0)에 absolute로 top:0 고정 → 어떤 여백도 없이 화면 최상단부터 시작
          divpop.style.cssText+=';position:absolute !important;top:0 !important;left:50% !important;transform:translateX(-50%) !important;height:auto !important;min-height:auto !important;max-height:none !important;margin:0 !important;padding:0 !important;border:0 !important;border-radius:0 !important;display:block !important;';
        }
        if(iframe){
          iframe.style.cssText+=';height:1000px !important;min-height:900px !important;display:block !important;margin:0 !important;padding:0 !important;border:0 !important;vertical-align:top !important;';
        }
        // body 스크롤 막힘 해제 (Innopay가 of_hidden 클래스 추가하지만 우리는 페이지 스크롤이 필요)
        try{document.documentElement.classList.remove('of_hidden');document.body.classList.remove('of_hidden');}catch(e){}
      }catch(e){console.warn('[innopay] modal style override failed',e);}
    }, 400);
  } catch (e) {
    alert('결제 연결 실패: ' + e.message);
    console.error('Innopay error:', e);
  }
}
