// 이메일 마케팅 자동 시퀀스 — 매일 1회 cron
// Resend API (무료 3,000 emails/month) 사용
// users 테이블 created_at, payments, last_active 기반 조건 발송
//
// 4가지 자동 시퀀스:
//  1. 가입 D+1 — 환영 + 무료체험 안내
//  2. 가입 D+3 — 외항사 vs 국내 추천 가이드
//  3. 가입 D+7 — 합격생 후기 + 결제 유도
//  4. 결제 D+30 — 갱신 안내
//  5. 비활성 14일 — 재참여
const { createClient } = require('@supabase/supabase-js');

// 이메일 템플릿 (한국어 기본)
const TEMPLATES = {
  welcome_d1: {
    id: 'welcome_d1',
    name: 'D+1 환영',
    subject: '✈️ 원더풀크루에 오신 걸 환영합니다 — 무료 모의면접 10회 시작하세요',
    html: (name) => `
<!DOCTYPE html>
<html><body style="font-family:'Apple SD Gothic Neo',sans-serif;background:#FAF7F0;padding:40px 20px;color:#1A2340;">
<div style="max-width:600px;margin:0 auto;background:#fff;padding:48px 40px;border-radius:12px;border-left:4px solid #C9A84C;">
  <h1 style="font-family:'DM Serif Display',serif;color:#1A2340;font-size:1.6rem;margin-bottom:20px;">${name || '안녕하세요'}님, 환영합니다 ✈️</h1>
  <p style="line-height:1.8;font-size:0.95rem;color:#4A4438;">
    7년차 에미레이트 일등석 출신 코치가 직접 만든 외항사 승무원 면접 시스템에 가입해주셔서 감사합니다.<br><br>
    지금 바로 <b>무료 모의면접 10회</b>를 시작하실 수 있어요.
  </p>
  <div style="margin:32px 0;text-align:center;">
    <a href="https://wonderfulcrew.com/leveltest" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#E8C96A,#C9A84C);color:#fff;text-decoration:none;border-radius:24px;font-weight:600;">무료 면접 시작하기 →</a>
  </div>
  <p style="font-size:0.86rem;color:#888;line-height:1.7;">
    💡 <b>오늘의 합격 팁</b>: 외항사 면접의 첫인상은 워킹·미소·시선 처리에서 결정됩니다. AI 면접 코치가 24시간 동안 귀찮을 만큼 연습시켜드려요.
  </p>
</div>
<div style="text-align:center;font-size:0.74rem;color:#888;margin-top:20px;">© 2026 WonderfulCrew · <a href="https://wonderfulcrew.com" style="color:#C9A84C;">wonderfulcrew.com</a></div>
</body></html>
    `
  },
  guide_d3: {
    id: 'guide_d3',
    name: 'D+3 추천 가이드',
    subject: '📋 외항사 vs 국내항공사 — 나에게 맞는 항공사 선택 가이드',
    html: (name) => `
<!DOCTYPE html>
<html><body style="font-family:'Apple SD Gothic Neo',sans-serif;background:#FAF7F0;padding:40px 20px;color:#1A2340;">
<div style="max-width:600px;margin:0 auto;background:#fff;padding:48px 40px;border-radius:12px;">
  <h1 style="font-family:'DM Serif Display',serif;font-size:1.4rem;margin-bottom:16px;">${name || '예비 승무원'}님, 어떤 항공사가 잘 맞을까요?</h1>
  <p style="line-height:1.8;font-size:0.95rem;color:#4A4438;">합격생 1,000명 데이터를 보면 본인의 영어·생활방식에 따라 추천 항공사가 다릅니다.</p>
  <div style="background:#FAF7F0;padding:20px;border-radius:8px;margin:20px 0;">
    <p style="font-weight:700;color:#C9A84C;margin-bottom:8px;">✈️ 외항사 추천 (에미레이트·카타르·싱가폴)</p>
    <p style="font-size:0.88rem;color:#4A4438;line-height:1.7;">영어 회화 자연스러운 분 / 글로벌 도시 거주 의향 / 연봉 우선</p>
  </div>
  <div style="background:#FAF7F0;padding:20px;border-radius:8px;margin:20px 0;">
    <p style="font-weight:700;color:#C9A84C;margin-bottom:8px;">🇰🇷 국내항공사 추천 (대한항공·아시아나·LCC)</p>
    <p style="font-size:0.88rem;color:#4A4438;line-height:1.7;">한국 거주 / 가족 가까이 / 토익 700+ 영어</p>
  </div>
  <div style="margin:32px 0;text-align:center;">
    <a href="https://wonderfulcrew.com/leveltest" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#E8C96A,#C9A84C);color:#fff;text-decoration:none;border-radius:24px;font-weight:600;">맞춤 항공사 진단 →</a>
  </div>
</div></body></html>
    `
  },
  upsell_d7: {
    id: 'upsell_d7',
    name: 'D+7 결제 유도',
    subject: '🎯 무료체험 끝나가요 — 합격생 1,000명이 선택한 패키지',
    html: (name) => `
<!DOCTYPE html>
<html><body style="font-family:'Apple SD Gothic Neo',sans-serif;background:#FAF7F0;padding:40px 20px;color:#1A2340;">
<div style="max-width:600px;margin:0 auto;background:#fff;padding:48px 40px;border-radius:12px;border-left:4px solid #C9A84C;">
  <h1 style="font-family:'DM Serif Display',serif;font-size:1.5rem;margin-bottom:16px;">${name || ''}님, 합격까지 함께 갈까요?</h1>
  <p style="line-height:1.8;font-size:0.95rem;color:#4A4438;">22개국 1,000명+ 합격생이 선택한 시스템 — 베이직 19만원부터 시작해요.</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:0.86rem;">
    <tr><th style="padding:10px;background:#1A2340;color:#E8C96A;text-align:left;">플랜</th><th style="padding:10px;background:#1A2340;color:#E8C96A;text-align:left;">가격</th><th style="padding:10px;background:#1A2340;color:#E8C96A;text-align:left;">핵심</th></tr>
    <tr><td style="padding:12px;border-bottom:1px solid #F5E9C8;">베이직</td><td>199,000원/월</td><td>면접·롤플레이·디스커션 무한</td></tr>
    <tr><td style="padding:12px;border-bottom:1px solid #F5E9C8;">엘리트</td><td>299,000원/월</td><td>+ AI 면접 코치 24시간</td></tr>
    <tr><td style="padding:12px;background:rgba(201,168,76,0.06);"><b>프리미엄 ⭐</b></td><td>2,500,000원/년</td><td>+ 1:1 코치 + 강의 + 라이브</td></tr>
  </table>
  <div style="margin:32px 0;text-align:center;">
    <a href="https://wonderfulcrew.com/plans" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#E8C96A,#C9A84C);color:#fff;text-decoration:none;border-radius:24px;font-weight:600;">요금제 자세히 보기 →</a>
  </div>
</div></body></html>
    `
  },
  reactivate_14d: {
    id: 'reactivate_14d',
    name: '비활성 14일 재참여',
    subject: '😢 보고 싶었어요 — 새 채용공고와 합격 후기가 쌓였어요',
    html: (name) => `
<!DOCTYPE html>
<html><body style="font-family:'Apple SD Gothic Neo',sans-serif;background:#FAF7F0;padding:40px 20px;color:#1A2340;">
<div style="max-width:600px;margin:0 auto;background:#fff;padding:48px 40px;border-radius:12px;">
  <h1 style="font-family:'DM Serif Display',serif;font-size:1.4rem;margin-bottom:16px;">${name || ''}님, 잘 지내고 계세요?</h1>
  <p style="line-height:1.8;font-size:0.95rem;color:#4A4438;">2주 동안 안 보이셔서요. 그 사이에:</p>
  <ul style="line-height:2;font-size:0.92rem;color:#4A4438;padding-left:20px;">
    <li>📌 에미레이트·카타르 새 Open Day 일정 공지</li>
    <li>🏆 합격 후기 새로 올라온 글 다수</li>
    <li>✨ AI 면접 코치 업데이트 (대답 분석 정확도 ↑)</li>
  </ul>
  <div style="margin:32px 0;text-align:center;">
    <a href="https://wonderfulcrew.com/jobs" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#E8C96A,#C9A84C);color:#fff;text-decoration:none;border-radius:24px;font-weight:600;">새 채용공고 확인 →</a>
  </div>
</div></body></html>
    `
  }
};

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

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({
      error: 'RESEND_API_KEY 환경변수 필요',
      setup: '1) https://resend.com 가입 (무료 3,000 emails/month) 2) API key 발급 3) Vercel 환경변수 RESEND_API_KEY 등록 4) FROM_EMAIL 도메인 인증'
    });
  }

  const fromEmail = process.env.FROM_EMAIL || 'noreply@wonderfulcrew.com';
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const summary = [];

  // 1. D+1 환영 — created_at 이 22~26시간 전인 사용자
  const d1From = new Date(now - 26 * 60 * 60 * 1000).toISOString();
  const d1To = new Date(now - 22 * 60 * 60 * 1000).toISOString();
  const { data: d1users } = await sb.from('users').select('auth_id, email, name')
    .gte('created_at', d1From).lt('created_at', d1To);
  summary.push(await sendBatch(sb, resendKey, fromEmail, d1users || [], TEMPLATES.welcome_d1));

  // 2. D+3 가이드
  const d3From = new Date(now - 76 * 60 * 60 * 1000).toISOString();
  const d3To = new Date(now - 70 * 60 * 60 * 1000).toISOString();
  const { data: d3users } = await sb.from('users').select('auth_id, email, name')
    .gte('created_at', d3From).lt('created_at', d3To);
  summary.push(await sendBatch(sb, resendKey, fromEmail, d3users || [], TEMPLATES.guide_d3));

  // 3. D+7 결제 유도 (미결제만)
  const d7From = new Date(now - 8 * oneDay).toISOString();
  const d7To = new Date(now - 7 * oneDay).toISOString();
  const { data: d7users } = await sb.from('users').select('auth_id, email, name, plan_active')
    .gte('created_at', d7From).lt('created_at', d7To).neq('plan_active', true);
  summary.push(await sendBatch(sb, resendKey, fromEmail, d7users || [], TEMPLATES.upsell_d7));

  // 4. 비활성 14일
  const inactFrom = new Date(now - 16 * oneDay).toISOString();
  const inactTo = new Date(now - 14 * oneDay).toISOString();
  const { data: inactRecs } = await sb.from('practice_records').select('user_id, created_at')
    .gte('created_at', inactFrom).lt('created_at', inactTo);
  const inactUserIds = [...new Set((inactRecs || []).map(r => r.user_id))];
  if (inactUserIds.length) {
    const { data: inactUsers } = await sb.from('users').select('auth_id, email, name')
      .in('auth_id', inactUserIds);
    summary.push(await sendBatch(sb, resendKey, fromEmail, inactUsers || [], TEMPLATES.reactivate_14d));
  }

  return res.json({ ok: true, runAt: new Date().toISOString(), summary });
};

async function sendBatch(sb, resendKey, from, users, tpl) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let sent = 0, failed = 0, skipped = 0;

  // 24시간 내 같은 캠페인 중복 발송 방지
  let recentEmails = [];
  try {
    const { data } = await sb.from('email_campaign_log')
      .select('email').eq('campaign_id', tpl.id).gte('sent_at', yesterday);
    recentEmails = (data || []).map(r => r.email);
  } catch (e) { /* 테이블 없음 */ }

  for (const u of users) {
    if (!u.email) { skipped++; continue; }
    if (recentEmails.indexOf(u.email) !== -1) { skipped++; continue; }
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + resendKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: from,
          to: [u.email],
          subject: tpl.subject,
          html: tpl.html(u.name || u.email.split('@')[0])
        })
      });
      const data = await r.json();
      if (r.ok && data.id) {
        sent++;
        try {
          await sb.from('email_campaign_log').insert({
            campaign_id: tpl.id,
            email: u.email,
            user_id: u.auth_id,
            resend_id: data.id,
            sent_at: new Date().toISOString()
          });
        } catch (e) {}
      } else {
        failed++;
      }
    } catch (e) {
      failed++;
    }
  }
  return { campaign: tpl.id, name: tpl.name, target: users.length, sent, failed, skipped };
}
