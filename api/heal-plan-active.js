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
    // ★ 환불·취소 우선 보호 — 가장 최근 payment row 의 status 가 refunded/cancelled 면 plan_active=false 강제
    //   (이전 버그: 환불 후에도 과거 completed row 보고 자동복구 → 환불 무효화)
    {
      const { data: latestAny } = await sb.from('payments')
        .select('id, status, created_at, user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      let latest = latestAny;
      if (!latest && email) {
        const anonId = 'anonymous_' + email;
        const { data: latestAnon } = await sb.from('payments')
          .select('id, status, created_at, user_id')
          .eq('user_id', anonId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        latest = latestAnon;
      }
      if (latest && (latest.status === 'refunded' || latest.status === 'cancelled')) {
        const now = new Date().toISOString();
        try {
          await sb.from('users').upsert({
            auth_id: userId, email: email || '',
            plan: 'free', plan_active: false, updated_at: now
          }, { onConflict: 'auth_id' });
          await sb.from('subscriptions').upsert({
            user_id: userId, plan: 'free', status: 'cancelled', updated_at: now
          }, { onConflict: 'user_id' });
        } catch(e) {}
        return res.json({ ok: true, planActive: false, reason: 'most_recent_payment_' + latest.status });
      }
    }

    // 1) auth_id 로 결제 조회
    let { data: payment } = await sb.from('payments')
      .select('id, plan, created_at, amount, user_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2) auth_id 로 못 찾으면 anonymous_<email> 패턴으로 재검색 — 비로그인 결제 자동 복구
    if (!payment && email) {
      const anonId = 'anonymous_' + email;
      const { data: anonPay } = await sb.from('payments')
        .select('id, plan, created_at, amount, user_id')
        .eq('user_id', anonId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (anonPay) {
        payment = anonPay;
        // 결제 user_id 를 실제 auth_id 로 migrate (이후 healing 에서 직접 매칭)
        try {
          await sb.from('payments').update({ user_id: userId }).eq('user_id', anonId);
        } catch(e) {}
      }
    }

    // 3) completed 결제 없음 + pending 결제 있으면 자동 completed 로 변환
    //    (innopay-confirm 콜백 누락 보상 — 결제창은 통과했지만 ReturnURL 콜백이 안 옴)
    let pendingHealed = false;
    if (!payment) {
      const { data: pendingPay } = await sb.from('payments')
        .select('id, plan, created_at, amount, user_id, moid')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pendingPay) {
        try {
          await sb.from('payments').update({ status: 'completed' }).eq('id', pendingPay.id);
          payment = pendingPay;
          pendingHealed = true;
        } catch(e) { console.warn('[heal] pending→completed update failed:', e.message); }
      }
      // anonymous_<email> 의 pending 도 동일 처리
      if (!payment && email) {
        const anonId = 'anonymous_' + email;
        const { data: anonPending } = await sb.from('payments')
          .select('id, plan, created_at, amount, user_id, moid')
          .eq('user_id', anonId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (anonPending) {
          try {
            await sb.from('payments').update({ status: 'completed', user_id: userId }).eq('id', anonPending.id);
            payment = { ...anonPending, user_id: userId };
            pendingHealed = true;
          } catch(e) {}
        }
      }
    }

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

    res.json({ ok: true, planActive: true, plan: plan, healedAt: now.toISOString(), pendingHealed: pendingHealed });
  } catch (e) {
    console.error('[heal-plan-active] exception:', e);
    res.status(500).json({ error: e.message });
  }
};
