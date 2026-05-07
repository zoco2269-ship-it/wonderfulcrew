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
      const today = new Date(); today.setHours(0,0,0,0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const weekAgo = new Date(today.getTime() - 7*24*60*60*1000);

      const [usersRes, paymentsRes, subsRes, visitsRes] = await Promise.all([
        sb.from('users').select('id, created_at, plan_active', { count: 'exact' }),
        sb.from('payments').select('id, amount, created_at, status'),
        sb.from('subscriptions').select('id, status').eq('status', 'active'),
        sb.from('page_visits').select('user_id, visited_at').gte('visited_at', weekAgo.toISOString())
      ]);

      const allUsers = usersRes.data || [];
      const allPayments = (paymentsRes.data || []).filter(p => p.status === 'completed');
      const monthPayments = allPayments.filter(p => new Date(p.created_at) >= monthStart);
      const todayUsers = allUsers.filter(u => new Date(u.created_at) >= today);
      const allVisits = visitsRes.data || [];
      const todayVisits = allVisits.filter(v => new Date(v.visited_at) >= today);
      const uniqueVisitorsToday = new Set(todayVisits.map(v => v.user_id)).size;
      const uniqueVisitorsWeek = new Set(allVisits.map(v => v.user_id)).size;

      return res.json({
        ok: true,
        totalMembers: allUsers.length,
        todayJoined: todayUsers.length,
        monthPaymentCount: monthPayments.length,
        monthRevenue: monthPayments.reduce((s, p) => s + (p.amount || 0), 0),
        activeSubscriptions: (subsRes.data || []).length,
        totalPayments: allPayments.length,
        allTimeRevenue: allPayments.reduce((s, p) => s + (p.amount || 0), 0),
        // 방문자 통계 (page_visits 기반 — 로그인 사용자만)
        visitsToday: todayVisits.length,
        visitsWeek: allVisits.length,
        uniqueVisitorsToday,
        uniqueVisitorsWeek
      });
    }

    if (scope === 'members') {
      const { data: users } = await sb.from('users').select('id, auth_id, email, name, phone, age, region, edu, apply_exp, eng_level, plan, plan_active, free_trial_used, created_at').order('created_at', { ascending: false }).limit(200);
      // 구독 정보 조인
      const userIds = (users || []).map(u => u.auth_id).filter(Boolean);
      const { data: subs } = userIds.length
        ? await sb.from('subscriptions').select('user_id, plan, status, expires_at').in('user_id', userIds)
        : { data: [] };
      const subMap = {};
      (subs || []).forEach(s => { subMap[s.user_id] = s; });
      // 사용 활동 집계 — practice/ai/video + page_visits (페이지 방문 — 환불 분쟁용 '이용 시작' 입증)
      const [prRes, fbRes, vrRes, pvRes] = userIds.length ? await Promise.all([
        sb.from('practice_records').select('user_id, created_at').in('user_id', userIds),
        sb.from('ai_feedback').select('user_id, created_at').in('user_id', userIds),
        sb.from('video_records').select('user_id, created_at').in('user_id', userIds),
        sb.from('page_visits').select('user_id, page, visited_at').in('user_id', userIds).order('visited_at', { ascending: false }).limit(2000)
      ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];
      const usage = {};
      function bump(uid, ts) {
        if (!uid) return;
        const u = usage[uid] = usage[uid] || { count: 0, last: null, visits: 0, last_visit: null, last_page: null };
        u.count += 1;
        if (!u.last || new Date(ts) > new Date(u.last)) u.last = ts;
      }
      function bumpVisit(uid, ts, page) {
        if (!uid) return;
        const u = usage[uid] = usage[uid] || { count: 0, last: null, visits: 0, last_visit: null, last_page: null };
        u.visits += 1;
        if (!u.last_visit || new Date(ts) > new Date(u.last_visit)) {
          u.last_visit = ts;
          u.last_page = page;
        }
      }
      (prRes.data || []).forEach(r => bump(r.user_id, r.created_at));
      (fbRes.data || []).forEach(r => bump(r.user_id, r.created_at));
      (vrRes.data || []).forEach(r => bump(r.user_id, r.created_at));
      (pvRes.data || []).forEach(r => bumpVisit(r.user_id, r.visited_at, r.page));
      const enriched = (users || []).map(u => {
        const v = usage[u.auth_id] || {};
        // 마지막 활동 = 콘텐츠 사용·페이지 방문 중 최근것
        let lastAny = v.last || null;
        if (v.last_visit && (!lastAny || new Date(v.last_visit) > new Date(lastAny))) lastAny = v.last_visit;
        return {
          ...u,
          subscription: subMap[u.auth_id] || null,
          usage_count: v.count || 0,
          page_visits: v.visits || 0,
          last_page: v.last_page || null,
          last_active_at: lastAny
        };
      });
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

    if (scope === 'user-history') {
      // 특정 사용자의 페이지 방문 + AI 호출 시퀀스 — 어디 갔고 무엇을 시도했는지 진단
      const targetEmail = String(req.body.targetEmail || '').trim().toLowerCase();
      if (!targetEmail) return res.status(400).json({ error: 'targetEmail required' });
      // 1) auth_id 찾기
      const { data: u } = await sb.from('users').select('auth_id, email, name, phone, age, region, edu, apply_exp, eng_level, free_trial_used, plan, plan_active, created_at').ilike('email', targetEmail).maybeSingle();
      if (!u || !u.auth_id) return res.json({ ok: true, found: false });
      const since = new Date(Date.now() - 30*24*60*60*1000).toISOString();
      const [{ data: visits }, { data: prs }, { data: fbs }, { data: vrs }, { data: lvls }] = await Promise.all([
        sb.from('page_visits').select('page, visited_at').eq('user_id', u.auth_id).gte('visited_at', since).order('visited_at', { ascending: true }).limit(500),
        sb.from('practice_records').select('id, airline, stage, score, created_at').eq('user_id', u.auth_id).order('created_at', { ascending: false }).limit(50),
        sb.from('ai_feedback').select('id, page, created_at').eq('user_id', u.auth_id).order('created_at', { ascending: false }).limit(50),
        sb.from('video_records').select('id, type, airline, created_at').eq('user_id', u.auth_id).order('created_at', { ascending: false }).limit(50),
        sb.from('level_results').select('score, level, created_at').eq('user_id', u.auth_id).order('created_at', { ascending: false }).limit(10)
      ]);
      return res.json({
        ok: true, found: true,
        user: u,
        visits: visits || [],
        practice_records: prs || [],
        ai_feedback: fbs || [],
        video_records: vrs || [],
        level_results: lvls || []
      });
    }

    if (scope === 'profile-funnel') {
      // profile-setup 흐름 비콘 — 최근 7일, 사용자별 단계 시퀀스 + 단계별 카운트
      const since = new Date(Date.now() - 7*24*60*60*1000).toISOString();
      const { data: visits } = await sb.from('page_visits')
        .select('user_id, email, page, visited_at')
        .like('page', 'profile-setup:%')
        .gte('visited_at', since)
        .order('visited_at', { ascending: false })
        .limit(2000);
      const all = visits || [];
      // 단계별 고유 사용자 카운트
      const stageUsers = {};
      all.forEach(v => {
        const stage = v.page.replace(/^profile-setup:/, '');
        if (!stageUsers[stage]) stageUsers[stage] = new Set();
        stageUsers[stage].add(v.user_id);
      });
      const funnel = {};
      Object.keys(stageUsers).forEach(s => { funnel[s] = stageUsers[s].size; });
      // 사용자별 시퀀스 (최근 30명)
      const byUser = {};
      all.forEach(v => {
        if (!byUser[v.user_id]) byUser[v.user_id] = { email: v.email || '', steps: [] };
        byUser[v.user_id].steps.push({ stage: v.page.replace(/^profile-setup:/, ''), at: v.visited_at });
      });
      const userList = Object.keys(byUser).map(uid => {
        const u = byUser[uid];
        u.steps.sort((a,b) => new Date(a.at) - new Date(b.at));
        return {
          user_id: uid,
          email: u.email,
          first_at: u.steps[0]?.at,
          last_at: u.steps[u.steps.length-1]?.at,
          last_stage: u.steps[u.steps.length-1]?.stage,
          steps: u.steps.map(s => s.stage)
        };
      }).sort((a,b) => new Date(b.last_at) - new Date(a.last_at)).slice(0, 30);
      return res.json({ ok: true, funnel, users: userList, totalEvents: all.length });
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
