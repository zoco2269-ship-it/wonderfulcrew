// 관리자 전용 — 특정 email 사용자의 plan_active 강제 활성화 (결제 자동화 실패 복구용)
// 또한 payments 테이블 + users 상태도 진단 응답으로 같이 반환
const { createClient } = require('@supabase/supabase-js');

const ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { adminEmail, targetEmail, plan, action } = req.body || {};
  if (!adminEmail || ADMIN_EMAILS.indexOf(adminEmail) === -1) {
    return res.status(403).json({ error: 'unauthorized' });
  }
  if (!targetEmail) return res.status(400).json({ error: 'targetEmail required' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // 1) auth.users 에서 email → auth_id 찾기
    const { data: authUsers } = await sb.auth.admin.listUsers();
    const target = (authUsers && authUsers.users || []).find(u => (u.email || '').toLowerCase() === targetEmail.toLowerCase());
    if (!target) return res.status(404).json({ error: 'auth user not found', targetEmail });
    const authId = target.id;

    // 2) 결제 내역 조회 (auth_id + anonymous_<email> 둘 다)
    const { data: pays1 } = await sb.from('payments')
      .select('id, plan, amount, status, moid, tid, created_at, user_id')
      .eq('user_id', authId).order('created_at', { ascending: false });
    const { data: pays2 } = await sb.from('payments')
      .select('id, plan, amount, status, moid, tid, created_at, user_id')
      .eq('user_id', 'anonymous_' + targetEmail).order('created_at', { ascending: false });
    const allPayments = [...(pays1 || []), ...(pays2 || [])];

    // 3) users 현재 상태
    const { data: userRow } = await sb.from('users').select('*').eq('auth_id', authId).maybeSingle();

    // diagnose 만 — 활성화 안 함
    if (action === 'diagnose') {
      return res.json({
        ok: true,
        authId,
        targetEmail,
        currentUser: userRow,
        payments: allPayments
      });
    }

    // activate — 강제 plan_active=true (action==='activate' 또는 미지정 시 기본)
    const now = new Date();
    const expiresAt = new Date(now);
    const usePlan = plan || (allPayments.find(p => p.status === 'completed')?.plan) || 'basic';
    if (usePlan === 'premium') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    await sb.from('users').upsert({
      auth_id: authId,
      email: targetEmail,
      plan: usePlan,
      plan_active: true,
      updated_at: now.toISOString()
    }, { onConflict: 'auth_id' });

    await sb.from('subscriptions').upsert({
      user_id: authId,
      plan: usePlan,
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString()
    }, { onConflict: 'user_id' });

    // anonymous_<email> 결제가 있으면 user_id 를 실제 auth_id 로 migrate
    if (pays2 && pays2.length) {
      try {
        await sb.from('payments').update({ user_id: authId }).eq('user_id', 'anonymous_' + targetEmail);
      } catch(e) {}
    }

    res.json({
      ok: true,
      activated: true,
      authId,
      targetEmail,
      plan: usePlan,
      expiresAt: expiresAt.toISOString(),
      payments: allPayments
    });
  } catch (e) {
    console.error('[admin-force-activate]', e);
    res.status(500).json({ error: e.message });
  }
};
