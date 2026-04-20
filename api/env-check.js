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
    { key: 'VAPID_PUBLIC_KEY',        purpose: '푸시 알림' },
    { key: 'VAPID_PRIVATE_KEY',       purpose: '푸시 알림' },
    { key: 'KAKAO_ALIMTALK_KEY',      purpose: '결제 완료 카톡 (없어도 됨)' },
    { key: 'SOLAPI_API_KEY',          purpose: 'SMS 발송 (휴대폰 인증용)' },
    { key: 'STRIPE_SECRET_KEY',       purpose: '스트라이프 (사용 안 함)' },
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
  const allRequiredSet = requiredCheck.every(v => v.set);

  res.json({
    ok: true,
    launchReady: allRequiredSet,
    required: requiredCheck,
    optional: optionalCheck
  });
};
