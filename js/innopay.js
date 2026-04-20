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
    // 1. 서버에서 결제 파라미터 준비
    var res = await fetch('/api/innopay-prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: plan || 'basic',
        buyerName: (buyerInfo && buyerInfo.buyerName) || '',
        buyerEmail: (buyerInfo && buyerInfo.buyerEmail) || '',
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
          wrap.style.cssText+=';overflow-y:auto !important;display:flex !important;align-items:flex-start !important;justify-content:center !important;padding:0 !important;margin:0 !important;';
          wrap.scrollTop=0;
        }
        if(divpop){
          divpop.style.cssText+=';position:relative !important;top:0 !important;left:auto !important;height:auto !important;min-height:auto !important;max-height:none !important;margin:0 !important;display:flex !important;flex-direction:column !important;border-radius:0 !important;';
        }
        if(iframe){
          // 결제 폼 전체 높이 확보 (대부분의 Innopay 폼이 ~900px 안에 들어감)
          iframe.style.cssText+=';height:1000px !important;min-height:900px !important;display:block !important;margin:0 !important;padding:0 !important;border:0 !important;vertical-align:top !important;';
        }
      }catch(e){console.warn('[innopay] modal style override failed',e);}
    }, 400);
  } catch (e) {
    alert('결제 연결 실패: ' + e.message);
    console.error('Innopay error:', e);
  }
}
