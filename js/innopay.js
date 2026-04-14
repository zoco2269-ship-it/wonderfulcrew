// 이노페이 팝업 높이 오버라이드 (680→800)
if(typeof ih!=='undefined') ih=800;
window.addEventListener('load',function(){if(typeof ih!=='undefined') ih=800;});

/**
 * WonderfulCrew 이노페이 결제 호출
 *
 * 사용법:
 *   payWithInnopay('basic')          // 베이직 월정액
 *   payWithInnopay('elite')          // 엘리트 월정액
 *   payWithInnopay('premium')        // 프리미엄 2년
 *   payWithInnopay('basic', { buyerName: '홍길동', buyerEmail: 'test@test.com', buyerTel: '01012345678' })
 */

async function payWithInnopay(plan, buyerInfo) {
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

    console.log('innopay.goPay calling with:', data);
    innopay.goPay({
      PayMethod: 'CARD',
      MID: data.mid,
      MerchantKey: data.merchantKey,
      GoodsName: data.goodsName,   // 상품명
      Amt: data.amount.toString(),  // 결제금액
      Moid: data.moid,             // 주문번호
      BuyerName: data.buyerName || 'WonderfulCrew',
      BuyerEmail: data.buyerEmail || 'user@wonderfulcrew.com',
      BuyerTel: data.buyerTel || '01000000000',
      ReturnURL: data.returnUrl,   // 인증 완료 후 서버 콜백
      Signature: data.signature,
      Timestamp: data.timestamp,
    });
  } catch (e) {
    alert('결제 연결 실패: ' + e.message);
    console.error('Innopay error:', e);
  }
}
