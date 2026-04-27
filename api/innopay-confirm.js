// 이노페이 결제 승인 API (Vercel Serverless)
// 결제창에서 인증 완료 후 호출됨 → 서버에서 최종 승인 요청 + payments/users 자동 INSERT
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // 이노페이는 POST로 인증 결과를 전달함
  const { resultCode, resultMsg, tid, mid, moid, amt, authToken, authUrl } =
    req.method === 'POST' ? (req.body || {}) : (req.query || {});

  const MID = process.env.INNOPAY_MID;
  const API_KEY = process.env.INNOPAY_API_KEY;

  if (!MID || !API_KEY) {
    return res.redirect('/plans.html?pay=error&msg=server_config');
  }

  // 인증 실패
  if (resultCode !== '0000') {
    return res.redirect(`/plans.html?pay=fail&msg=${encodeURIComponent(resultMsg || 'auth_failed')}`);
  }

  try {
    // 서명 생성
    const signData = MID + tid + amt + API_KEY;
    const signature = crypto.createHash('sha256').update(signData).digest('hex');

    // 이노페이 승인 API 호출
    const approveRes = await fetch(authUrl || 'https://api.innopay.co.kr/api/innopay/payment/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mid: MID,
        tid: tid,
        moid: moid,
        amt: amt,
        signature: signature,
      }),
    });

    const approveData = await approveRes.json();

    if (approveData.resultCode === '0000') {
      // ★ server-side 자동 저장 — success.html fetch 실패에 의존하지 X
      try {
        const sbUrl = process.env.SUPABASE_URL;
        const sbKey = process.env.SUPABASE_SERVICE_KEY;
        if (sbUrl && sbKey) {
          const sb = createClient(sbUrl, sbKey);
          // moid 형식: WC|userId|email|plan|timestamp
          const parts = String(moid).split('|');
          const userId = parts[1] && parts[1] !== 'anon' ? parts[1] : null;
          const email = parts[2] || '';
          const plan = parts[3] || 'basic';
          const amount = parseInt(amt, 10) || 0;
          // 중복 저장 방지
          const { data: existing } = await sb.from('payments').select('id').eq('moid', moid).maybeSingle();
          if (!existing) {
            await sb.from('payments').insert({
              user_id: userId || ('anonymous_' + (email || moid)),
              plan: plan,
              amount: amount,
              method: 'innopay',
              tid: tid || '',
              moid: moid,
              status: 'completed'
            });
          }
          // users.upsert(plan_active=true)
          if (userId) {
            const now = new Date();
            try {
              await sb.from('users').upsert({
                auth_id: userId, email: email, plan: plan,
                plan_active: true, updated_at: now.toISOString()
              }, { onConflict: 'auth_id' });
              const expiresAt = new Date(now);
              if (plan === 'premium') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
              else expiresAt.setMonth(expiresAt.getMonth() + 1);
              await sb.from('subscriptions').upsert({
                user_id: userId, plan: plan, status: 'active',
                started_at: now.toISOString(), expires_at: expiresAt.toISOString(),
                updated_at: now.toISOString()
              }, { onConflict: 'user_id' });
            } catch(e) { console.warn('[innopay-confirm] users/subs upsert:', e.message); }
          }
        }
      } catch(e) { console.warn('[innopay-confirm] server save error:', e.message); }
      // 결제 성공 → success 페이지로 리다이렉트
      return res.redirect(`/success.html?pay=innopay&tid=${tid}&moid=${encodeURIComponent(moid)}&amount=${amt}`);
    } else {
      return res.redirect(`/plans.html?pay=fail&msg=${encodeURIComponent(approveData.resultMsg || 'approve_failed')}`);
    }
  } catch (e) {
    return res.redirect(`/plans.html?pay=error&msg=${encodeURIComponent(e.message)}`);
  }
}
