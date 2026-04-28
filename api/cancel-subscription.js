// admin 전용 — 사용자 구독 취소·환불 처리
// payments.refunded + subscriptions.cancelled + users.plan_active=false 일괄
const { createClient } = require('@supabase/supabase-js');
const ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { adminEmail, targetUserId, targetEmail, paymentId } = req.body || {};
  if (!adminEmail || ADMIN_EMAILS.indexOf(adminEmail) === -1) {
    return res.status(403).json({ error: 'unauthorized' });
  }
  if (!targetUserId && !targetEmail) {
    return res.status(400).json({ error: 'targetUserId or targetEmail required' });
  }

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // 사용자 찾기
    let userId = targetUserId;
    let email = targetEmail || '';
    if (!userId && targetEmail) {
      const { data: u } = await sb.from('users').select('auth_id, email').eq('email', targetEmail).maybeSingle();
      if (u) { userId = u.auth_id; email = u.email; }
    }
    if (!userId) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const now = new Date().toISOString();

    // 1) payments → refunded (특정 paymentId 지정 시 그것만, 아니면 가장 최근 completed)
    if (paymentId) {
      await sb.from('payments').update({ status: 'refunded' }).eq('id', paymentId);
    } else {
      const { data: latest } = await sb.from('payments')
        .select('id').eq('user_id', userId).eq('status', 'completed')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (latest) await sb.from('payments').update({ status: 'refunded' }).eq('id', latest.id);
    }

    // 2) subscriptions → cancelled
    await sb.from('subscriptions').upsert({
      user_id: userId,
      plan: 'free',
      status: 'cancelled',
      updated_at: now
    }, { onConflict: 'user_id' });

    // 3) users → plan_active=false, plan='free'
    await sb.from('users').upsert({
      auth_id: userId,
      email: email,
      plan: 'free',
      plan_active: false,
      updated_at: now
    }, { onConflict: 'auth_id' });

    // 4) refund_requests 기록 (이력 추적)
    try {
      await sb.from('refund_requests').insert({
        user_id: userId,
        email: email,
        decision: 'APPROVED_BY_ADMIN',
        reason: 'admin이 결제 취소·환불 처리'
      });
    } catch(e) {}

    res.json({ ok: true, userId: userId, cancelledAt: now });
  } catch (e) {
    console.error('[cancel-subscription] error', e);
    res.status(500).json({ error: e.message });
  }
};
