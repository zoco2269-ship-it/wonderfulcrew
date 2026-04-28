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
      // ★ server-side 자동 저장 — prepare 시 미리 박은 pending payment 를 completed 로 update + users 활성화
      try {
        const sbUrl = process.env.SUPABASE_URL;
        const sbKey = process.env.SUPABASE_SERVICE_KEY;
        if (sbUrl && sbKey) {
          const sb = createClient(sbUrl, sbKey);
          // prepare 단계에서 박힌 pending row 조회 → user_id/plan 복원
          const { data: pending } = await sb.from('payments')
            .select('user_id, plan, amount').eq('moid', moid).maybeSingle();
          const amount = parseInt(amt, 10) || (pending && pending.amount) || 0;
          if (pending) {
            // pending → completed 업데이트
            await sb.from('payments').update({ status: 'completed', tid: tid || '' }).eq('moid', moid);
            const userId = pending.user_id && !pending.user_id.startsWith('anonymous_') ? pending.user_id : null;
            const plan = pending.plan || 'basic';
            if (userId) {
              const now = new Date();
              const expiresAt = new Date(now);
              if (plan === 'premium') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
              else expiresAt.setMonth(expiresAt.getMonth() + 1);
              try {
                await sb.from('users').upsert({
                  auth_id: userId, plan: plan,
                  plan_active: true, updated_at: now.toISOString()
                }, { onConflict: 'auth_id' });
                await sb.from('subscriptions').upsert({
                  user_id: userId, plan: plan, status: 'active',
                  started_at: now.toISOString(), expires_at: expiresAt.toISOString(),
                  updated_at: now.toISOString()
                }, { onConflict: 'user_id' });
              } catch(e) { console.warn('[innopay-confirm] users/subs:', e.message); }
            }
          }
        }
      } catch(e) { console.warn('[innopay-confirm] server save:', e.message); }
      // 결제 성공 → success 페이지로 리다이렉트
      return res.redirect(`/success.html?pay=innopay&tid=${tid}&moid=${moid}&amount=${amt}`);
    } else {
      return res.redirect(`/plans.html?pay=fail&msg=${encodeURIComponent(approveData.resultMsg || 'approve_failed')}`);
    }
  } catch (e) {
    return res.redirect(`/plans.html?pay=error&msg=${encodeURIComponent(e.message)}`);
  }
}
