// 이노페이 가상계좌 입금 확인 Webhook
// 이노페이 관리자에서 Webhook URL을 이 엔드포인트로 설정:
//   https://wonderfulcrew.com/api/innopay-webhook
//
// 환경변수: INNOPAY_MID, INNOPAY_API_KEY, KAKAO_ALIMTALK_KEY (선택)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { resultCode, resultMsg, tid, mid, moid, amt, payMethod } = req.body || {};

  // 가상계좌 입금 완료 확인 (resultCode 0000)
  if (resultCode !== '0000') {
    console.log('[Webhook] Non-success:', resultCode, resultMsg);
    return res.status(200).json({ result: 'ignored', reason: resultCode });
  }

  console.log('[Webhook] Payment confirmed:', { tid, moid, amt, payMethod });

  // 주문번호에서 플랜 추출 (WC_basic_timestamp 형태)
  const parts = (moid || '').split('_');
  const plan = parts[1] || 'basic';

  // ---- 1. 플랜 액세스 활성화 ----
  // Supabase에 저장 (DB 연동 후 활성화)
  // 현재는 로그만 남김
  const activationData = {
    tid: tid,
    moid: moid,
    plan: plan,
    amount: amt,
    activatedAt: new Date().toISOString(),
    status: 'active',
  };
  console.log('[Webhook] Plan activated:', activationData);

  // TODO: Supabase DB에 결제 기록 저장
  // const { createClient } = require('@supabase/supabase-js');
  // const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  // await supabase.from('payments').insert(activationData);
  // await supabase.from('users').update({ plan: plan, plan_active: true }).eq('moid', moid);

  // ---- 2. 카카오 알림톡 웰컴 메시지 발송 ----
  if (process.env.KAKAO_ALIMTALK_KEY) {
    try {
      const planNames = { basic: '베이직', elite: '엘리트', premium: '프리미엄 합격 완성' };
      const planName = planNames[plan] || plan;

      // 알리고 API (카카오 알림톡 대행 서비스) 예시
      // 실제 사용 시 알리고(aligo.in) 또는 NHN Cloud 등 알림톡 발송 서비스 가입 필요
      await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          apikey: process.env.KAKAO_ALIMTALK_KEY,
          userid: process.env.KAKAO_ALIMTALK_ID || '',
          senderkey: process.env.KAKAO_SENDER_KEY || '',
          tpl_code: process.env.KAKAO_WELCOME_TPL || 'TW_0001',
          sender: process.env.KAKAO_SENDER_PHONE || '',
          receiver_1: '',  // TODO: 주문자 전화번호 (DB에서 조회)
          subject_1: 'WonderfulCrew 가입 완료',
          message_1: `[WonderfulCrew]\n\n${planName} 플랜 결제가 완료되었습니다!\n\n지금 바로 면접 연습을 시작하세요.\nhttps://wonderfulcrew.com\n\n문의: 카카오톡 @wonderfulcrew`,
        }),
      });
      console.log('[Webhook] Alimtalk sent for plan:', planName);
    } catch (e) {
      console.error('[Webhook] Alimtalk error:', e.message);
    }
  }

  res.status(200).json({ result: 'success', moid: moid, plan: plan });
}
