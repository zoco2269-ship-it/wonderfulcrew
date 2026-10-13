// 관리자가 입금 확인 후 승인 → payments + subscriptions + users 업데이트
const { createClient } = require('@supabase/supabase-js');

const ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { adminEmail, depositId, action } = req.body || {};
  if (!adminEmail || ADMIN_EMAILS.indexOf(adminEmail) === -1) {
    return res.status(403).json({ error: 'unauthorized' });
  }
  if (!depositId || !action) return res.status(400).json({ error: 'depositId and action required' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const { data: deposit, error: fetchErr } = await sb.from('pending_deposits').select('*').eq('id', depositId).single();
    if (fetchErr || !deposit) return res.status(404).json({ error: 'deposit not found' });
    if (deposit.status !== 'pending') return res.status(400).json({ error: 'already processed: ' + deposit.status });

    if (action === 'reject') {
      await sb.from('pending_deposits').update({
        status: 'rejected',
        approved_at: new Date().toISOString(),
        approved_by: adminEmail
      }).eq('id', depositId);
      return res.json({ ok: true, action: 'rejected' });
    }

    if (action !== 'approve') return res.status(400).json({ error: 'action must be approve or reject' });

    // 승인 처리: payments + subscriptions + users 업데이트
    const now = new Date();
    const expiresAt = new Date(now);
    if (deposit.plan === 'premium') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    const moid = 'DEPOSIT' + Date.now();

    // payments 기록
    await sb.from('payments').insert({
      user_id: deposit.user_id || ('anonymous_' + (deposit.email || moid)),
      plan: deposit.plan,
      amount: deposit.amount,
      method: 'bank_transfer',
      tid: '',
      moid: moid,
      status: 'completed'
    });

    // subscriptions upsert
    if (deposit.user_id) {
      await sb.from('subscriptions').upsert({
        user_id: deposit.user_id,
        plan: deposit.plan,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString()
      }, { onConflict: 'user_id' });

      try {
        await sb.from('users').update({
          plan: deposit.plan,
          plan_active: true,
          updated_at: now.toISOString()
        }).eq('auth_id', deposit.user_id);
      } catch(e) {}
    }

    // pending_deposits 상태 업데이트
    await sb.from('pending_deposits').update({
      status: 'approved',
      approved_at: now.toISOString(),
      approved_by: adminEmail
    }).eq('id', depositId);

    res.json({ ok: true, action: 'approved', expiresAt: expiresAt.toISOString() });
  } catch (e) {
    console.error('[approve-deposit]', e);
    res.status(500).json({ error: e.message });
  }
};
