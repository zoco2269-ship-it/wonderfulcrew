// 이노페이 결제 준비 API (Vercel Serverless)
// 환경변수: INNOPAY_MID, INNOPAY_API_KEY
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const MID = process.env.INNOPAY_MID;
  const API_KEY = process.env.INNOPAY_API_KEY;

  if (!MID || !API_KEY) {
    return res.status(500).json({ error: 'INNOPAY_MID or INNOPAY_API_KEY not configured' });
  }

  try {
    const { plan, buyerName, buyerEmail, buyerTel, userId } = req.body || {};

    // 플랜별 가격
    const plans = {
      basic:   { name: 'WonderfulCrew Basic (월정액 30일)',  amount: 199000 },
      elite:   { name: 'WonderfulCrew Elite (월정액 30일)',  amount: 299000 },
      premium: { name: 'WonderfulCrew Premium (1년)',         amount: 2500000 },
    };

    const selected = plans[plan] || plans.basic;
    const timestamp = Date.now().toString();
    // 이노페이 moid 는 영숫자만 허용 — 특수문자 X. WC + timestamp 단순 형식.
    const moid = 'WC' + timestamp;

    // prepare 시점에 supabase 에 pending payment 미리 기록 (moid 를 key 로)
    // confirm.js 가 moid 로 조회해 user 정보 복원 → server-side 자동 INSERT 가능
    try {
      const sbUrl = process.env.SUPABASE_URL;
      const sbKey = process.env.SUPABASE_SERVICE_KEY;
      if (sbUrl && sbKey) {
        const { createClient } = require('@supabase/supabase-js');
        const sb = createClient(sbUrl, sbKey);
        await sb.from('payments').insert({
          user_id: userId || ('anonymous_' + (buyerEmail || moid)),
          plan: plan || 'basic',
          amount: selected.amount,
          method: 'innopay',
          tid: '',
          moid: moid,
          status: 'pending'
        });
      }
    } catch(e) { console.warn('[prepare] pending insert:', e.message); }

    // 서명 생성: SHA256(MID + moid + amount + API_KEY)
    const signData = MID + moid + selected.amount + API_KEY;
    const signature = crypto.createHash('sha256').update(signData).digest('hex');

    res.status(200).json({
      mid: MID,
      merchantKey: API_KEY,
      moid: moid,
      goodsName: selected.name,
      amount: selected.amount,
      buyerName: buyerName || '',
      buyerEmail: buyerEmail || '',
      buyerTel: buyerTel || '',
      timestamp: timestamp,
      signature: signature,
      returnUrl: `${req.headers.origin || 'https://wonderfulcrew.vercel.app'}/api/innopay-confirm`,
      closeUrl: `${req.headers.origin || 'https://wonderfulcrew.vercel.app'}/plans.html`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
