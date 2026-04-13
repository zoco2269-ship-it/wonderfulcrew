// Stripe Subscription (월정액 정기결제) API
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
    const { plan } = req.body || {};

    // 월정액 플랜별 가격 (KRW)
    const plans = {
      monthly: { amount: 500000, interval: 'month', name: '월 무제한', interval_count: 1 },
      quarter: { amount: 1300000, interval: 'month', name: '3개월 무제한', interval_count: 3 },
      half: { amount: 2300000, interval: 'month', name: '6개월 무제한', interval_count: 6 }
    };

    const selected = plans[plan] || plans.monthly;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'krw',
          product_data: { name: 'WonderfulCrew ' + selected.name },
          unit_amount: selected.amount,
          recurring: {
            interval: selected.interval,
            interval_count: selected.interval_count
          }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'https://wonderfulcrew.vercel.app'}/success.html?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://wonderfulcrew.vercel.app'}/token-rewards.html`,
    });

    res.status(200).json({ url: session.url, id: session.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
