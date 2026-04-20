// 결제 완료 시 Supabase에 기록 + 구독 상태 활성화
// success.html에서 결제 직후 호출
const { createClient } = require('@supabase/supabase-js');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { userId, email, name, plan, tid, moid, amount } = req.body || {};
  if (!moid || !amount) return res.status(400).json({ error: 'moid and amount required' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // 중복 저장 방지: 같은 moid 이미 있으면 skip
    const { data: existing } = await sb.from('payments').select('id').eq('moid', moid).maybeSingle();
    if (existing) {
      return res.json({ ok: true, alreadyRecorded: true, paymentId: existing.id });
    }

    // 결제 기록
    const { data: payment, error: payErr } = await sb.from('payments').insert({
      user_id: userId || ('anonymous_' + (email || moid)),
      plan: plan || '',
      amount: parseInt(amount, 10) || 0,
      method: 'innopay',
      tid: tid || '',
      moid: moid,
      status: 'completed'
    }).select().single();
    if (payErr) console.warn('[save-payment] insert payment error:', payErr.message);

    // 구독 활성화 (premium은 1년, basic/elite는 1개월)
    const now = new Date();
    const expiresAt = new Date(now);
    if (plan === 'premium') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    if (userId) {
      const { error: subErr } = await sb.from('subscriptions').upsert({
        user_id: userId,
        plan: plan || 'basic',
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString()
      }, { onConflict: 'user_id' });
      if (subErr) console.warn('[save-payment] upsert subscription error:', subErr.message);

      // public.users 프로필도 plan 업데이트
      try {
        await sb.from('users').update({
          plan: plan || 'basic',
          plan_active: true,
          updated_at: now.toISOString()
        }).eq('auth_id', userId);
      } catch(e) {}
    }

    res.json({ ok: true, paymentId: payment?.id, expiresAt: expiresAt.toISOString() });
  } catch (e) {
    console.error('[save-payment] exception:', e);
    res.status(500).json({ error: e.message });
  }
};
