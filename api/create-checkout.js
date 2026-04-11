// Stripe Checkout Session 생성 API (Vercel Serverless)
// 환경변수: STRIPE_SECRET_KEY
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { priceId, mode } = req.body || {};

    // 테스트 모드: 임시 가격 (250만원 = 2,500,000원)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'krw',
          product_data: {
            name: 'WonderfulCrew 합격 완성 올패키지',
            description: '플랫폼 무제한 + 강의 영상 + 라이브 수강 + 1:1 코치 피드백',
          },
          unit_amount: 2500000, // 250만원 (테스트: 나중에 실제 가격 설정)
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://wonderfulcrew.vercel.app'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://wonderfulcrew.vercel.app'}/pricing.html`,
    });

    res.status(200).json({ url: session.url, id: session.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
