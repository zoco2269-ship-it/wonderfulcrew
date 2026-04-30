// 이노페이 Webhook — 결제/환불/취소 자동 처리
// 이노페이 가맹점 admin 에서 webhook URL 등록:
//   https://wonderfulcrew.com/api/innopay-webhook
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const body = req.body || {};
  const { resultCode, tid, moid, amt, payMethod, tradeStatus, payStatus, cancelYN } = body;
  console.log('[Webhook] received:', JSON.stringify(body));

  if (!moid) return res.status(200).json({ result: 'no_moid' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // 상태 판정 — 보수적 로직. 'completed' 결제건은 명시적 cancelYN='Y' 신호 있을 때만 다운그레이드.
  // (이전 버그: substring 'cancel' 만 있어도 정상 결제를 cancelled 로 마킹하던 문제 — 정상 결제 보호)
  const statusStr = String(payStatus || tradeStatus || '').toLowerCase();
  const isExplicitCancel = cancelYN === 'Y';
  const isExplicitRefund = statusStr === 'refund' || statusStr === 'refunded' || statusStr === '환불';

  // 기존 payment row 조회 (newStatus 판정 전에 먼저 조회 — 상태 보호 위해)
  const { data: payment } = await sb.from('payments').select('*').eq('moid', moid).maybeSingle();
  const currentStatus = payment ? payment.status : null;

  let newStatus;
  if (isExplicitCancel) {
    newStatus = 'cancelled';
  } else if (isExplicitRefund) {
    newStatus = 'refunded';
  } else if (resultCode === '0000' || resultCode === '00') {
    // 명시적 cancel/refund 신호 없는 success 통보 — 신규 또는 pending → completed 로만 허용
    // 이미 completed 인 결제는 그대로 둠 (덮어쓰기 X)
    if (currentStatus === 'completed') {
      console.log('[Webhook] skip — already completed:', moid);
      return res.status(200).json({ result: 'noop_already_completed', moid });
    }
    newStatus = 'completed';
  } else {
    // resultCode 가 success 아니고 명시적 cancel/refund 신호도 없음 → 함부로 cancelled 처리하지 않음
    console.log('[Webhook] skip — unclear signal. resultCode:', resultCode, 'moid:', moid, 'body:', JSON.stringify(body));
    return res.status(200).json({ result: 'skipped_unclear', moid, resultCode: resultCode });
  }

  // 'completed' 결제건은 명시적 cancel/refund 신호 있을 때만 다운그레이드 가능 (정상 결제 보호 핵심 가드)
  if (currentStatus === 'completed' && newStatus !== 'completed' && !isExplicitCancel && !isExplicitRefund) {
    console.log('[Webhook] skip downgrade — completed protected:', moid, 'incoming:', JSON.stringify(body));
    return res.status(200).json({ result: 'skipped_downgrade_protected', moid });
  }

  if (!payment) {
    // payments 에 row 없음 → 새로 INSERT (이노페이 직접 결제 / prepare 누락)
    await sb.from('payments').insert({
      user_id: 'anonymous_webhook_' + moid,
      plan: 'basic',
      amount: parseInt(amt, 10) || 0,
      method: payMethod || 'innopay',
      tid: tid || '',
      moid: moid,
      status: newStatus
    });
    return res.status(200).json({ result: 'created', status: newStatus });
  }

  // 기존 payment update
  await sb.from('payments').update({
    status: newStatus,
    tid: tid || payment.tid
  }).eq('moid', moid);

  // users.plan_active 자동 토글 (실 user_id 인 경우만)
  const userId = payment.user_id;
  if (userId && !userId.startsWith('anonymous_')) {
    const now = new Date().toISOString();
    if (newStatus === 'completed') {
      const plan = payment.plan || 'basic';
      const expiresAt = new Date();
      if (plan === 'premium') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      else expiresAt.setMonth(expiresAt.getMonth() + 1);
      try {
        await sb.from('users').upsert({
          auth_id: userId, plan: plan, plan_active: true, updated_at: now
        }, { onConflict: 'auth_id' });
        await sb.from('subscriptions').upsert({
          user_id: userId, plan: plan, status: 'active',
          started_at: now, expires_at: expiresAt.toISOString(), updated_at: now
        }, { onConflict: 'user_id' });
      } catch(e) { console.warn('[Webhook] activate error:', e.message); }
    } else if (newStatus === 'cancelled' || newStatus === 'refunded') {
      // 자동 비활성화 — 환불·취소 시 즉시 plan_active=false
      try {
        await sb.from('users').update({
          plan_active: false, updated_at: now
        }).eq('auth_id', userId);
        await sb.from('subscriptions').update({
          status: 'cancelled', updated_at: now
        }).eq('user_id', userId);
      } catch(e) { console.warn('[Webhook] deactivate error:', e.message); }
    }
  }

  res.status(200).json({ result: 'updated', moid, status: newStatus });
};
