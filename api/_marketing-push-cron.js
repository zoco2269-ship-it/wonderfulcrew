// 마케팅 푸시 자동화 cron — 매일 1회
// 4가지 시나리오 자동 발송:
//  1. 무료체험 잔여 ≤ 2회 사용자 → 결제 유도
//  2. 결제 사용자 만료 7일 전 → 갱신 안내
//  3. 비활성 사용자 7일 미접속 → 재참여 유도
//  4. 새 채용공고 발견 시 → 알림 (별도 시점)
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const CAMPAIGNS = [
  {
    id: 'trial_low',
    name: '무료체험 거의 끝',
    title: '🔔 무료체험 곧 종료',
    body: '베이직 플랜 19만원으로 무한 연습 시작 — 첫 합격생 1,000명+ 가 선택한 시스템.',
    url: '/plans',
    targetFilter: async (sb) => {
      // free_trial_used >= 8 인 미결제 사용자
      const { data } = await sb.from('users').select('auth_id, free_trial_used, plan_active').gte('free_trial_used', 8).neq('plan_active', true);
      return (data || []).map(u => u.auth_id);
    }
  },
  {
    id: 'expiring_soon',
    name: '구독 만료 7일 전',
    title: '⏰ 구독 만료 7일 남음',
    body: '연장하지 않으면 곧 모든 기능이 잠깁니다. 합격까지 함께하세요.',
    url: '/plans',
    targetFilter: async (sb) => {
      const inOneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const inSixDays = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await sb.from('subscriptions').select('user_id, expires_at, status').eq('status', 'active').gte('expires_at', inSixDays).lt('expires_at', inOneWeek);
      return (data || []).map(s => s.user_id);
    }
  },
  {
    id: 'inactive_7d',
    name: '비활성 7일',
    title: '✈️ 면접 연습이 그리워요',
    body: '에미레이트·카타르 새 채용 공고 떴어요. 지금 모의면접 한 번 어때요?',
    url: '/leveltest',
    targetFilter: async (sb) => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      // practice_records 가 7~14일 전이 마지막인 사용자
      const { data } = await sb.from('practice_records').select('user_id, created_at').gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo);
      // 중복 제거
      const userMap = {};
      (data || []).forEach(r => { if (!userMap[r.user_id]) userMap[r.user_id] = r.created_at; });
      return Object.keys(userMap);
    }
  }
];

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 인증
  const cronSecret = process.env.CRON_SECRET || '';
  const authHeader = req.headers && (req.headers.authorization || req.headers['x-cron-secret'] || '');
  const isVercelCron = req.headers && req.headers['user-agent'] && req.headers['user-agent'].indexOf('vercel-cron') !== -1;
  const adminEmail = (req.body && req.body.adminEmail) || (req.query && req.query.adminEmail) || '';
  const ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];
  if (!isVercelCron && !(cronSecret && authHeader.indexOf(cronSecret) !== -1) && ADMIN_EMAILS.indexOf(adminEmail) === -1) {
    return res.status(403).json({ error: 'unauthorized' });
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'VAPID keys missing' });
  }
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'zoco2269@gmail.com'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const summary = [];

  // 중복 발송 방지를 위해 marketing_push_log 테이블 활용 (24시간 이내 같은 캠페인 X)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  for (const camp of CAMPAIGNS) {
    try {
      // 24시간 내 이 캠페인 받은 user 조회
      let recentUserIds = [];
      try {
        const { data: recent } = await sb.from('marketing_push_log')
          .select('user_id').eq('campaign_id', camp.id).gte('sent_at', yesterday);
        recentUserIds = (recent || []).map(r => r.user_id);
      } catch (e) { /* 테이블 없으면 무시 */ }

      // 타겟 사용자 조회
      const targetUserIds = await camp.targetFilter(sb);
      const newTargets = targetUserIds.filter(id => recentUserIds.indexOf(id) === -1);

      let sent = 0, failed = 0;
      for (const userId of newTargets) {
        // 그 사용자의 push subscription 조회
        const { data: subs } = await sb.from('push_subscriptions')
          .select('*').eq('user_id', userId).eq('active', true);
        for (const sub of (subs || [])) {
          try {
            await webpush.sendNotification({
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth }
            }, JSON.stringify({
              title: camp.title,
              body: camp.body,
              url: camp.url,
              tag: 'wc-' + camp.id
            }));
            sent++;
            // 로그 기록 (테이블 있으면)
            try {
              await sb.from('marketing_push_log').insert({
                campaign_id: camp.id,
                user_id: userId,
                sent_at: new Date().toISOString()
              });
            } catch(e) {}
          } catch (e) {
            failed++;
            if (e.statusCode === 410 || e.statusCode === 404) {
              await sb.from('push_subscriptions').update({ active: false }).eq('endpoint', sub.endpoint);
            }
          }
        }
      }
      summary.push({ campaign: camp.id, name: camp.name, target_count: newTargets.length, sent, failed });
    } catch (e) {
      summary.push({ campaign: camp.id, error: e.message });
    }
  }

  return res.json({
    ok: true,
    runAt: new Date().toISOString(),
    campaigns: summary,
    note: 'marketing_push_log 테이블 없으면 중복 발송 가능. SQL: create table if not exists marketing_push_log (id bigserial primary key, campaign_id text, user_id text, sent_at timestamptz default now()); create index if not exists mpl_camp_user_idx on marketing_push_log(campaign_id, user_id, sent_at desc);'
  });
};
