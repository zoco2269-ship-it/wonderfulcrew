// 이노페이 결제 승인 API (Vercel Serverless)
// 결제창에서 인증 완료 후 호출됨 → 서버에서 최종 승인 요청
const crypto = require('crypto');

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
      // 결제 성공 → success 페이지로 리다이렉트
      return res.redirect(`/success.html?pay=innopay&tid=${tid}&moid=${moid}&amount=${amt}`);
    } else {
      return res.redirect(`/plans.html?pay=fail&msg=${encodeURIComponent(approveData.resultMsg || 'approve_failed')}`);
    }
  } catch (e) {
    return res.redirect(`/plans.html?pay=error&msg=${encodeURIComponent(e.message)}`);
  }
}
