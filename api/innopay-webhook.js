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

  // 상태 판정
  const status = String(payStatus || tradeStatus || '').toLowerCase();
  let newStatus;
  if (resultCode === '0000' || resultCode === '00') {
    if (cancelYN === 'Y' || status.includes('cancel') || status.includes('취소')) newStatus = 'cancelled';
    else if (status.includes('refund') || status.includes('환불')) newStatus = 'refunded';
    else newStatus = 'completed';
  } else {
    newStatus = 'cancelled';
  }

  // 기존 payment row 조회
  const { data: payment } = await sb.from('payments').select('*').eq('moid', moid).maybeSingle();

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
