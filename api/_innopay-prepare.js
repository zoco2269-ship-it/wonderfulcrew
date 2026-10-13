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
    const { plan, buyerName, buyerEmail, buyerTel, userId, lang } = req.body || {};
    const isEn = lang === 'en';

    // 플랜별 가격 + 영문/한글 goodsName 분기 (영문 사용자 결제창에 한국어 노출 차단)
    const plans = isEn ? {
      basic:   { name: 'WonderfulCrew Basic (Monthly, 30 days)', amount: 199000 },
      elite:   { name: 'WonderfulCrew Elite (Monthly, 30 days)', amount: 299000 },
      premium: { name: 'WonderfulCrew Premium (1 year)',          amount: 2500000 },
      premium_live: { name: 'WonderfulCrew Premium (1 year, Live Special 20% OFF)', amount: 1990000 },
    } : {
      basic:   { name: 'WonderfulCrew Basic (월정액 30일)',  amount: 199000 },
      elite:   { name: 'WonderfulCrew Elite (월정액 30일)',  amount: 299000 },
      premium: { name: 'WonderfulCrew Premium (1년)',         amount: 2500000 },
      premium_live: { name: 'WonderfulCrew Premium (1년) 라이브 특별가 20% 할인', amount: 1990000 },
    };

    // 라이브 특별가는 기간 한정 — 2026-09-22 23:59:59 (KST) 이후에는 결제 준비 자체를 거절
    if (plan === 'premium_live' && Date.now() > Date.parse('2026-09-22T23:59:59+09:00')) {
      return res.status(400).json({ error: isEn ? 'This special offer has ended.' : '라이브 특별가 기간이 종료되었습니다.' });
    }

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
        const row = {
          user_id: userId || ('anonymous_' + (buyerEmail || moid)),
          // premium_live 는 할인가 결제 — 플랜은 premium 으로 기록(1년 활성화 로직 재사용), 금액만 199만원
          plan: plan === 'premium_live' ? 'premium' : (plan || 'basic'),
          amount: selected.amount,
          method: 'innopay',
          tid: '',
          moid: moid,
          status: 'pending'
        };
        // 라이브 특별가 결제는 이름·연락처도 우리 DB 에 보관 (payments.buyer_name / buyer_tel 컬럼)
        if (plan === 'premium_live') { row.buyer_name = buyerName || ''; row.buyer_tel = buyerTel || ''; }
        let ins = await sb.from('payments').insert(row);
        // 컬럼이 아직 없으면 기존 방식(이름·연락처 제외)으로 재시도 — 결제 자체는 절대 막지 않는다
        if (ins.error && plan === 'premium_live') {
          delete row.buyer_name; delete row.buyer_tel;
          ins = await sb.from('payments').insert(row);
        }
        if (ins.error) console.warn('[prepare] pending insert:', ins.error.message);
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
      returnUrl: `${req.headers.origin || 'https://wonderfulcrew.vercel.app'}/api/innopay-confirm?lang=${isEn ? 'en' : 'ko'}`,
      closeUrl: `${req.headers.origin || 'https://wonderfulcrew.vercel.app'}/${isEn ? 'plans-en.html' : 'plans.html'}`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
