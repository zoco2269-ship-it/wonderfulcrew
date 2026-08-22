// 결제 완료 시 관리자(정미)에게 이메일 알림 — Resend 사용.
// (server-side helper, NOT an endpoint — underscore prefix 는 Vercel 라우팅에서 무시됨)
//
// 어느 결제 성공 경로에서 호출돼도 안전:
//   - 절대 예외를 던지지 않음(발송 실패해도 결제 자체엔 영향 X)
//   - moid 기준으로 딱 1회만 발송(confirm/webhook/save-payment 가 동시에 불려도 중복 X)
//
// 필요한 환경변수 (이미 다른 기능에서 쓰던 것 재사용 — 신규 시크릿 없음):
//   RESEND_API_KEY         (필수)  — 없으면 조용히 skip
//   ADMIN_EMAIL            (선택)  — 알림 받을 주소, 기본 zoco2269@gmail.com (정미님)
//   FROM_EMAIL            (선택)  — 발신 주소, 기본 noreply@wonderfulcrew.com
//   EMAIL_DOMAIN_VERIFIED (선택)  — '1' 이면 FROM_EMAIL 사용, 아니면 onboarding@resend.dev 로 발신
//
// dedup 을 위해 payments 테이블에 admin_notified 컬럼이 필요:
//   ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS admin_notified BOOLEAN DEFAULT false;
// (컬럼이 아직 없어도 발송은 되도록 폴백 — 다만 중복 발송 가능하니 마이그레이션 권장)

const PLAN_LABELS = {
  basic: '베이직 (Basic)',
  elite: '엘리트 (Elite)',
  premium: '프리미엄 (Premium)',
  kids_premium: '키즈 프리미엄 (Kids Premium)',
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

// FROM_EMAIL 이 "이름 <메일>" 형태가 아니면 표시 이름을 붙여준다 (seminar-signup.js 와 동일 규칙)
function fromName(fromEmail) {
  return /</.test(fromEmail) ? fromEmail : ('원더풀크루 <' + fromEmail + '>');
}

// paypal → USD, 그 외(이노페이) → KRW 로 금액 포맷
function formatAmount(amount, method) {
  const n = Math.round(parseFloat(amount) || 0);
  return method === 'paypal'
    ? ('$' + n.toLocaleString('en-US'))
    : (n.toLocaleString('ko-KR') + '원');
}

// 결제자 정보 보강: email/name 이 비어있고 userId 가 실 유저면 users 테이블에서 조회
async function resolvePayer(sb, { name, email, userId }) {
  let outName = (name || '').trim();
  let outEmail = (email || '').trim();
  if (sb && userId && !String(userId).startsWith('anonymous_') && (!outEmail || !outName)) {
    try {
      const { data } = await sb.from('users')
        .select('email, name').eq('auth_id', userId).maybeSingle();
      if (data) {
        if (!outEmail) outEmail = data.email || '';
        if (!outName) outName = data.name || '';
      }
    } catch (e) { /* 조회 실패해도 무시 */ }
  }
  return { name: outName, email: outEmail };
}

// moid 기준 원자적 dedup: 이번 호출이 최초일 때만 true.
// 컬럼이 없으면(마이그레이션 전) 에러 → true 로 폴백(발송은 되게).
async function claimNotify(sb, moid) {
  if (!sb || !moid) return true;
  try {
    const { data, error } = await sb.from('payments')
      .update({ admin_notified: true })
      .eq('moid', moid)
      .not('admin_notified', 'is', true)
      .select('id');
    if (error) {
      console.warn('[notify-payment] claim error (admin_notified 컬럼 미존재 가능):', error.message);
      return true; // 폴백 — 발송은 되게
    }
    return Array.isArray(data) && data.length > 0;
  } catch (e) {
    console.warn('[notify-payment] claim threw:', e.message);
    return true;
  }
}

function buildHtml({ payerName, payerEmail, userId, planLabel, amountStr, methodLabel, moid, tid, when }) {
  const row = (label, value) =>
    '<tr>' +
    '<td style="padding:8px 16px 8px 0;color:#888;white-space:nowrap;vertical-align:top;">' + label + '</td>' +
    '<td style="padding:8px 0;color:#1A2340;font-weight:600;">' + value + '</td>' +
    '</tr>';
  return (
    '<div style="font-family:\'Apple SD Gothic Neo\',sans-serif;background:#FAF7F0;padding:32px 16px;color:#1A2340;">' +
    '<div style="max-width:560px;margin:0 auto;background:#fff;padding:36px 32px;border-radius:12px;border-left:4px solid #C9A84C;">' +
    '<h1 style="font-size:1.3rem;margin:0 0 8px;">💳 새 결제가 완료됐어요</h1>' +
    '<p style="color:#4A4438;font-size:0.92rem;margin:0 0 20px;">원더풀크루에서 결제(구독/패키지)가 성공했습니다.</p>' +
    '<table style="border-collapse:collapse;font-size:0.95rem;width:100%;">' +
    row('결제자', esc(payerName) || '<span style="color:#aaa;">(이름 미확인)</span>') +
    row('이메일', esc(payerEmail) || '<span style="color:#aaa;">(이메일 미확인)</span>') +
    row('플랜', esc(planLabel)) +
    row('결제 금액', esc(amountStr)) +
    row('결제 수단', esc(methodLabel)) +
    row('결제 시각', esc(when)) +
    row('주문번호(moid)', '<span style="font-family:monospace;font-size:0.85rem;">' + esc(moid || '-') + '</span>') +
    (tid ? row('거래번호(tid)', '<span style="font-family:monospace;font-size:0.85rem;">' + esc(tid) + '</span>') : '') +
    (userId && !String(userId).startsWith('anonymous_')
      ? row('회원 ID', '<span style="font-family:monospace;font-size:0.8rem;">' + esc(userId) + '</span>')
      : '') +
    '</table>' +
    '<div style="margin-top:24px;text-align:center;">' +
    '<a href="https://www.wonderfulcrew.com/admin" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#E8C96A,#C9A84C);color:#fff;text-decoration:none;border-radius:22px;font-weight:600;font-size:0.9rem;">관리자에서 확인 →</a>' +
    '</div>' +
    '</div>' +
    '<div style="text-align:center;font-size:0.74rem;color:#888;margin-top:16px;">© 2026 WonderfulCrew · 결제 자동 알림</div>' +
    '</div>'
  );
}

// 메인: 결제 완료 알림 발송
//   sb      — Supabase service-role 클라이언트(있으면 dedup + 결제자 보강에 사용, 없어도 발송은 됨)
//   payer   — { name, email }
//   userId  — 실 유저 auth_id 또는 anonymous_*
//   plan    — 'basic' | 'elite' | 'premium' | 'kids_premium'
//   amount  — 숫자/문자
//   method  — 'innopay' | 'paypal'
//   moid    — 주문번호(dedup 키)
//   tid     — 거래번호(선택)
async function sendPaymentNotification({ sb, payer = {}, userId, plan, amount, method, moid, tid } = {}) {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) { console.warn('[notify-payment] RESEND_API_KEY 미설정 — 알림 skip'); return; }

    // 중복 방지 — moid 기준 최초 1회만
    const first = await claimNotify(sb, moid);
    if (!first) { console.log('[notify-payment] 이미 발송된 결제 — skip:', moid); return; }

    const resolved = await resolvePayer(sb, { name: payer.name, email: payer.email, userId });

    const verified = process.env.EMAIL_DOMAIN_VERIFIED === '1';
    const fromEmail = verified ? (process.env.FROM_EMAIL || 'noreply@wonderfulcrew.com') : 'onboarding@resend.dev';
    const adminEmail = process.env.ADMIN_EMAIL || 'zoco2269@gmail.com';

    const planLabel = PLAN_LABELS[plan] || (plan || '-');
    const amountStr = formatAmount(amount, method);
    const methodLabel = method === 'paypal' ? 'PayPal (해외)' : '이노페이 (국내)';
    const when = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const subject = '💳 [원더풀크루] 결제 완료 — ' + planLabel + ' / ' + amountStr +
      (resolved.name ? ' (' + resolved.name + ')' : '');

    const html = buildHtml({
      payerName: resolved.name, payerEmail: resolved.email, userId,
      planLabel, amountStr, methodLabel, moid, tid, when,
    });

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromName(fromEmail), to: adminEmail, subject, html }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      console.warn('[notify-payment] resend 발송 실패:', t);
    } else {
      console.log('[notify-payment] 발송 완료 →', adminEmail, '| moid:', moid);
    }
  } catch (e) {
    console.warn('[notify-payment] error:', e.message);
  }
}

module.exports = { sendPaymentNotification, PLAN_LABELS };
