// 어드민 대시보드용 실데이터 조회 (Service Key 사용 → RLS 우회)
// 어드민 이메일만 접근 가능
const { createClient } = require('@supabase/supabase-js');

const ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { adminEmail, scope } = req.body || {};
  if (!adminEmail || ADMIN_EMAILS.indexOf(adminEmail) === -1) {
    return res.status(403).json({ error: 'unauthorized' });
  }

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    if (scope === 'overview') {
      const [usersRes, paymentsRes, subsRes] = await Promise.all([
        sb.from('users').select('id, created_at, plan_active', { count: 'exact' }),
        sb.from('payments').select('id, amount, created_at, status'),
        sb.from('subscriptions').select('id, status').eq('status', 'active')
      ]);

      const today = new Date(); today.setHours(0,0,0,0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const allUsers = usersRes.data || [];
      const allPayments = (paymentsRes.data || []).filter(p => p.status === 'completed');
      const monthPayments = allPayments.filter(p => new Date(p.created_at) >= monthStart);
      const todayUsers = allUsers.filter(u => new Date(u.created_at) >= today);

      return res.json({
        ok: true,
        totalMembers: allUsers.length,
        todayJoined: todayUsers.length,
        monthPaymentCount: monthPayments.length,
        monthRevenue: monthPayments.reduce((s, p) => s + (p.amount || 0), 0),
        activeSubscriptions: (subsRes.data || []).length,
        totalPayments: allPayments.length,
        allTimeRevenue: allPayments.reduce((s, p) => s + (p.amount || 0), 0)
      });
    }

    if (scope === 'members') {
      const { data: users } = await sb.from('users').select('id, auth_id, email, name, plan, plan_active, free_trial_used, created_at').order('created_at', { ascending: false }).limit(200);
      // 구독 정보 조인
      const userIds = (users || []).map(u => u.auth_id).filter(Boolean);
      const { data: subs } = userIds.length
        ? await sb.from('subscriptions').select('user_id, plan, status, expires_at').in('user_id', userIds)
        : { data: [] };
      const subMap = {};
      (subs || []).forEach(s => { subMap[s.user_id] = s; });
      const enriched = (users || []).map(u => ({
        ...u,
        subscription: subMap[u.auth_id] || null
      }));
      return res.json({ ok: true, members: enriched });
    }

    if (scope === 'payments') {
      const { data: payments } = await sb.from('payments').select('*').order('created_at', { ascending: false }).limit(200);
      const userIds = [...new Set((payments || []).map(p => p.user_id).filter(Boolean))];
      const { data: users } = userIds.length
        ? await sb.from('users').select('auth_id, email, name').in('auth_id', userIds)
        : { data: [] };
      const userMap = {};
      (users || []).forEach(u => { userMap[u.auth_id] = u; });
      const enriched = (payments || []).map(p => ({
        ...p,
        user_email: userMap[p.user_id]?.email || '',
        user_name: userMap[p.user_id]?.name || ''
      }));
      return res.json({ ok: true, payments: enriched });
    }

    if (scope === 'feedback-requests') {
      const { data: reqs } = await sb.from('coach_requests').select('*').order('created_at', { ascending: false }).limit(100);
      return res.json({ ok: true, requests: reqs || [] });
    }

    if (scope === 'pending-deposits') {
      const { data: deposits } = await sb.from('pending_deposits').select('*').order('created_at', { ascending: false }).limit(200);
      return res.json({ ok: true, deposits: deposits || [] });
    }

    return res.status(400).json({ error: 'unknown scope' });
  } catch (e) {
    console.error('[admin-data] error:', e);
    res.status(500).json({ error: e.message });
  }
};
