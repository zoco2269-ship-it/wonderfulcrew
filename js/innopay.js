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
    if (typeof INNOPAY === 'undefined') {
      alert('이노페이 SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
      return;
    }

    INNOPAY.goPay({
      PayMethod: 'CARD',           // 신용카드
      MID: data.mid,               // 상점 ID
      MerchantKey: '',             // 서버에서 서명 처리하므로 빈값
      GoodsName: data.goodsName,   // 상품명
      Amt: data.amount.toString(),  // 결제금액
      Moid: data.moid,             // 주문번호
      BuyerName: data.buyerName,
      BuyerEmail: data.buyerEmail,
      BuyerTel: data.buyerTel,
      ReturnURL: data.returnUrl,   // 인증 완료 후 서버 콜백
      Signature: data.signature,
      Timestamp: data.timestamp,
    });
  } catch (e) {
    alert('결제 연결에 실패했습니다. 다시 시도해주세요.');
    console.error('Innopay error:', e);
  }
}
