// One-time setup: creates the PayPal Product + Basic/Elite subscription Plans from _paypal PLANS.
// Run AFTER PAYPAL_CLIENT_ID / PAYPAL_SECRET / PAYPAL_MODE are set, then copy the returned
// plan ids into PAYPAL_PLAN_BASIC / PAYPAL_PLAN_ELITE env vars.
// Re-run this whenever you change a subscription price (it creates fresh plans).
//
// Usage (protect it): POST /api/paypal-setup-plans  with header  x-setup-key: <PAYPAL_SETUP_KEY>
//   (If PAYPAL_SETUP_KEY is not set, the endpoint still requires valid PayPal credentials to do anything.)
const { PLANS, CURRENCY, apiBase, getAccessToken } = require('./_paypal.js');

async function createProduct(token) {
  const r = await fetch(apiBase() + '/v1/catalogs/products', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'WonderfulCrew Membership',
      description: 'WonderfulCrew cabin-crew coaching membership',
      type: 'SERVICE',
      category: 'EDUCATIONAL_AND_TEXTBOOKS'
    })
  });
  const d = await r.json();
  if (!r.ok) throw new Error('product create failed: ' + JSON.stringify(d));
  return d.id;
}

async function createPlan(token, productId, key) {
  const p = PLANS[key];
  const r = await fetch(apiBase() + '/v1/billing/plans', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      name: p.name,
      description: p.desc || p.name,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: { interval_unit: p.interval_unit, interval_count: p.interval_count },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // 0 = infinite until cancelled
        pricing_scheme: { fixed_price: { value: p.amount, currency_code: CURRENCY } }
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      }
    })
  });
  const d = await r.json();
  if (!r.ok) throw new Error('plan create failed (' + key + '): ' + JSON.stringify(d));
  return d.id;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only — call this once to create plans' });

  const setupKey = process.env.PAYPAL_SETUP_KEY;
  if (setupKey && req.headers['x-setup-key'] !== setupKey) {
    return res.status(401).json({ error: 'invalid setup key' });
  }

  try {
    const token = await getAccessToken();
    const productId = await createProduct(token);
    const planBasic = await createPlan(token, productId, 'basic');
    const planElite = await createPlan(token, productId, 'elite');
    res.status(200).json({
      ok: true,
      productId,
      PAYPAL_PLAN_BASIC: planBasic,
      PAYPAL_PLAN_ELITE: planElite,
      next: 'Copy PAYPAL_PLAN_BASIC and PAYPAL_PLAN_ELITE into your Vercel env vars, then redeploy.'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
