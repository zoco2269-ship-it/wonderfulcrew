// 무통장 입금 신청 API — 사용자가 입금 예정 신고 → Supabase pending_deposits 저장
const { createClient } = require('@supabase/supabase-js');

const PLANS = {
  basic:   { name: 'WonderfulCrew Basic (월정액)',    amount: 199000 },
  elite:   { name: 'WonderfulCrew Elite (월정액)',    amount: 299000 },
  premium: { name: 'WonderfulCrew Premium (1년)',     amount: 2500000 },
};

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { userId, email, name, plan, depositorName, phone, memo } = req.body || {};
  const selected = PLANS[plan];
  if (!selected) return res.status(400).json({ error: 'invalid plan' });
  if (!depositorName || !depositorName.trim()) return res.status(400).json({ error: 'depositor name required' });
  if (!email) return res.status(400).json({ error: 'email required' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await sb.from('pending_deposits').insert({
      user_id: userId || null,
      email: email,
      name: name || '',
      plan: plan,
      amount: selected.amount,
      depositor_name: depositorName.trim(),
      phone: phone || '',
      memo: memo || '',
      status: 'pending'
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, id: data.id, amount: selected.amount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
