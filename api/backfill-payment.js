// 누락된 결제 수동 백필 (관리자 전용)
const { createClient } = require('@supabase/supabase-js');
const ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { adminEmail, targetEmail, plan, amount, tid } = req.body || {};
  if (!adminEmail || ADMIN_EMAILS.indexOf(adminEmail) === -1) {
    return res.status(403).json({ error: 'unauthorized' });
  }
  if (!targetEmail || !plan || !amount) {
    return res.status(400).json({ error: 'targetEmail, plan, amount required' });
  }

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // 대상 사용자 찾기
    const { data: targetUser } = await sb.from('users').select('auth_id, email, name').eq('email', targetEmail).maybeSingle();
    if (!targetUser) {
      return res.status(404).json({ error: 'user not found in users table. 먼저 그 이메일로 로그인해야 users 테이블에 자동 등록됩니다.' });
    }

    const moid = 'BACKFILL_' + Date.now();
    const now = new Date();
    const expiresAt = new Date(now);
    if (plan === 'premium') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    // 결제 기록
    const { error: payErr } = await sb.from('payments').insert({
      user_id: targetUser.auth_id,
      plan: plan,
      amount: parseInt(amount, 10),
      method: 'innopay',
      tid: tid || '',
      moid: moid,
      status: 'completed'
    });
    if (payErr) console.warn('[backfill] payment insert', payErr.message);

    // 구독 활성화
    await sb.from('subscriptions').upsert({
      user_id: targetUser.auth_id,
      plan: plan,
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString()
    }, { onConflict: 'user_id' });

    // 사용자 프로필 plan 업데이트
    await sb.from('users').update({
      plan: plan,
      plan_active: true,
      updated_at: now.toISOString()
    }).eq('auth_id', targetUser.auth_id);

    res.json({ ok: true, user: targetUser, expiresAt: expiresAt.toISOString() });
  } catch (e) {
    console.error('[backfill] error', e);
    res.status(500).json({ error: e.message });
  }
};
