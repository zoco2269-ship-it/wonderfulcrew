// payments 테이블에 결제 기록 있는데 users.plan_active 가 false/없음 인 사용자 자동 복구
// 페이지 로드 시 supabase-client.js 가 자동 호출 — 사용자가 추가 동작 X
const { createClient } = require('@supabase/supabase-js');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { userId, email } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // 1) 가장 최근 completed 결제 1건 조회
    const { data: payment } = await sb.from('payments')
      .select('plan, created_at, amount')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment) {
      return res.json({ ok: true, planActive: false, reason: 'no_payment' });
    }

    // 2) 결제 기록 있음 → users 테이블 upsert (row 없으면 생성, 있으면 plan_active=true)
    const plan = payment.plan || 'basic';
    const now = new Date();
    await sb.from('users').upsert({
      auth_id: userId,
      email: email || '',
      plan: plan,
      plan_active: true,
      updated_at: now.toISOString()
    }, { onConflict: 'auth_id' });

    // 3) subscriptions 도 활성 상태 보장
    const expiresAt = new Date(now);
    if (plan === 'premium') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);
    try {
      await sb.from('subscriptions').upsert({
        user_id: userId,
        plan: plan,
        status: 'active',
        started_at: payment.created_at,
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString()
      }, { onConflict: 'user_id' });
    } catch(e) {}

    res.json({ ok: true, planActive: true, plan: plan, healedAt: now.toISOString() });
  } catch (e) {
    console.error('[heal-plan-active] exception:', e);
    res.status(500).json({ error: e.message });
  }
};
