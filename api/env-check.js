// 환경변수 설정 상태만 확인 (값은 노출하지 않음). 어드민만 호출 가능.
const ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { adminEmail } = req.body || {};
  if (!adminEmail || ADMIN_EMAILS.indexOf(adminEmail) === -1) {
    return res.status(403).json({ error: 'unauthorized' });
  }

  const required = [
    { key: 'SUPABASE_URL',            purpose: 'DB 연결',           critical: true },
    { key: 'SUPABASE_SERVICE_KEY',    purpose: 'DB 쓰기 권한',        critical: true },
    { key: 'INNOPAY_MID',             purpose: '카드 결제',           critical: true },
    { key: 'INNOPAY_API_KEY',         purpose: '카드 결제 서명',       critical: true },
    { key: 'ANTHROPIC_API_KEY',       purpose: 'AI 코칭·피드백',      critical: true },
  ];
  const optional = [
    { key: 'GOOGLE_CLOUD_TTS_KEY',    purpose: 'TTS 음성 (없으면 브라우저 TTS 폴백)' },
    { key: 'VAPID_PUBLIC_KEY',        purpose: '웹푸시 알림 (공개키)' },
    { key: 'VAPID_PRIVATE_KEY',       purpose: '웹푸시 알림 (비공개키)' },
    { key: 'KAKAO_ALIMTALK_KEY',      purpose: '결제 완료 카톡 (없어도 됨)' },
    { key: 'SOLAPI_API_KEY',          purpose: 'SMS 발송 (휴대폰 인증용)' },
    { key: 'STRIPE_SECRET_KEY',       purpose: '스트라이프 (영어 결제 도입 시 필요)' },
  ];

  // 마케팅 자동화 — SNS·이메일 채널
  const marketing = [
    { key: 'CRON_SECRET',             purpose: 'Vercel cron / 외부 트리거 인증' },
    { key: 'RESEND_API_KEY',          purpose: '📧 이메일 캠페인 발송 (Resend)' },
    { key: 'THREADS_ACCESS_TOKEN',    purpose: '🧵 Threads 자동 발행' },
    { key: 'THREADS_USER_ID',         purpose: '🧵 Threads 사용자 ID' },
    { key: 'FB_PAGE_ACCESS_TOKEN',    purpose: '📘 Facebook 페이지 발행' },
    { key: 'FB_PAGE_ID',              purpose: '📘 Facebook 페이지 ID' },
    { key: 'IG_ACCESS_TOKEN',         purpose: '📷 Instagram 발행 (보통 FB 토큰과 동일)' },
    { key: 'IG_USER_ID',              purpose: '📷 Instagram 비즈니스 계정 ID' },
    { key: 'X_API_KEY',               purpose: '🐦 X(Twitter) API Key' },
    { key: 'X_API_SECRET',            purpose: '🐦 X(Twitter) API Secret' },
    { key: 'X_ACCESS_TOKEN',          purpose: '🐦 X(Twitter) Access Token' },
    { key: 'X_ACCESS_TOKEN_SECRET',   purpose: '🐦 X(Twitter) Access Token Secret' },
    { key: 'X_BEARER_TOKEN',          purpose: '🐦 X(Twitter) Bearer (read 전용 가능성)' },
  ];

  function check(list) {
    return list.map(v => ({
      key: v.key,
      purpose: v.purpose,
      critical: !!v.critical,
      set: !!(process.env[v.key] && process.env[v.key].length > 0),
      preview: process.env[v.key] ? (v.key.includes('URL') ? process.env[v.key].substring(0, 30) + '...' : '*'.repeat(8)) : ''
    }));
  }

  const requiredCheck = check(required);
  const optionalCheck = check(optional);
  const marketingCheck = check(marketing);
  const allRequiredSet = requiredCheck.every(v => v.set);

  // 마케팅 채널별 활성 상태 요약
  const channelStatus = {
    email_resend:  marketingCheck.find(v => v.key === 'RESEND_API_KEY')?.set || false,
    threads:       (marketingCheck.find(v => v.key === 'THREADS_ACCESS_TOKEN')?.set && marketingCheck.find(v => v.key === 'THREADS_USER_ID')?.set) || false,
    facebook:      (marketingCheck.find(v => v.key === 'FB_PAGE_ACCESS_TOKEN')?.set && marketingCheck.find(v => v.key === 'FB_PAGE_ID')?.set) || false,
    instagram:     (marketingCheck.find(v => v.key === 'IG_ACCESS_TOKEN')?.set && marketingCheck.find(v => v.key === 'IG_USER_ID')?.set) || false,
    x_twitter:     (marketingCheck.find(v => v.key === 'X_API_KEY')?.set && marketingCheck.find(v => v.key === 'X_ACCESS_TOKEN')?.set) || false,
    push_webpush:  (optionalCheck.find(v => v.key === 'VAPID_PUBLIC_KEY')?.set && optionalCheck.find(v => v.key === 'VAPID_PRIVATE_KEY')?.set) || false,
  };

  res.json({
    ok: true,
    launchReady: allRequiredSet,
    required: requiredCheck,
    optional: optionalCheck,
    marketing: marketingCheck,
    channelStatus,
  });
};
