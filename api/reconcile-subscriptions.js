// 자동 환불·취소 동기화 크론 — 1시간마다 자동 실행 (vercel.json crons)
// webhook 누락이나 INNOPAY admin 직접 환불 시 status mismatch 자동 감지·복구
// 안전망: payments.status (=결제 진실원) 와 users.plan_active 불일치 시 강제 동기화
const { createClient } = require('@supabase/supabase-js');

module.exports = async function(req, res) {
  // Vercel cron 또는 admin 만 호출 허용
  const cronSecret = process.env.CRON_SECRET || '';
  const authHeader = req.headers && (req.headers.authorization || req.headers['x-cron-secret'] || '');
  const isVercelCron = req.headers && req.headers['user-agent'] && req.headers['user-agent'].indexOf('vercel-cron') !== -1;
  const adminEmail = (req.body && req.body.adminEmail) || (req.query && req.query.adminEmail) || '';
  const ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];
  const isAuthed = (
    isVercelCron ||
    (cronSecret && authHeader.indexOf(cronSecret) !== -1) ||
    ADMIN_EMAILS.indexOf(adminEmail) !== -1
  );
  if (!isAuthed) return res.status(403).json({ error: 'unauthorized' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const fixes = [];
  const errors = [];

  try {
    // 1) 활성 사용자 (users.plan_active=true) 전체 조회
    const { data: activeUsers, error: e1 } = await sb.from('users')
      .select('auth_id, email, plan_active, plan, updated_at')
      .eq('plan_active', true);
    if (e1) {
      console.error('[reconcile] users query error:', e1);
      return res.status(500).json({ error: e1.message });
    }

    // 2) 각 사용자별 가장 최근 payment 조회 → status 가 refunded/cancelled 면 plan_active=false 강제
    for (const user of (activeUsers || [])) {
      try {
        const { data: latestPayment } = await sb.from('payments')
          .select('id, status, created_at, moid')
          .eq('user_id', user.auth_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // payment 자체가 없으면 plan_active=true 가 부당한 상태 — but 일부 admin 수동 활성화 케이스 있을 수 있어 일단 skip
        if (!latestPayment) continue;

        if (latestPayment.status === 'refunded' || latestPayment.status === 'cancelled') {
          // 환불·취소된 결제건이 가장 최근 → plan_active 즉시 false
          const now = new Date().toISOString();
          await sb.from('users').update({
            plan: 'free', plan_active: false, updated_at: now
          }).eq('auth_id', user.auth_id);
          await sb.from('subscriptions').upsert({
            user_id: user.auth_id, plan: 'free', status: 'cancelled', updated_at: now
          }, { onConflict: 'user_id' });
          fixes.push({
            userId: user.auth_id,
            email: user.email,
            reason: 'most_recent_payment_' + latestPayment.status,
            paymentId: latestPayment.id,
            moid: latestPayment.moid
          });
        }
      } catch (e) {
        errors.push({ userId: user.auth_id, error: e.message });
      }
    }

    // 3) subscriptions.status mismatch 도 같이 정리 — users.plan_active=false 인데 subscriptions=active 인 경우
    const { data: subs } = await sb.from('subscriptions')
      .select('user_id, status')
      .eq('status', 'active');
    for (const sub of (subs || [])) {
      try {
        const { data: u } = await sb.from('users')
          .select('plan_active')
          .eq('auth_id', sub.user_id)
          .maybeSingle();
        if (u && u.plan_active === false) {
          await sb.from('subscriptions').update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          }).eq('user_id', sub.user_id);
          fixes.push({
            userId: sub.user_id,
            reason: 'subscriptions_active_but_user_inactive'
          });
        }
      } catch (e) {
        errors.push({ userId: sub.user_id, error: e.message });
      }
    }

    console.log('[reconcile] completed. fixes:', fixes.length, 'errors:', errors.length);
    return res.json({
      ok: true,
      runAt: new Date().toISOString(),
      activeUsersChecked: (activeUsers || []).length,
      fixedCount: fixes.length,
      fixes: fixes,
      errorCount: errors.length,
      errors: errors
    });
  } catch (e) {
    console.error('[reconcile] exception:', e);
    return res.status(500).json({ error: e.message });
  }
};
