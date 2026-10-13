// Create a one-time PayPal order (Premium package). Amount is set server-side from _paypal PLANS.
const { PLANS, CURRENCY, apiBase, getAccessToken, packCustomId } = require('./_paypal.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const plan = body.plan || 'premium';
  const cfg = PLANS[plan];
  if (!cfg || !cfg.amount) return res.status(400).json({ error: 'Unknown or non one-time plan: ' + plan });

  try {
    const token = await getAccessToken();
    const r = await fetch(apiBase() + '/v2/checkout/orders', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: CURRENCY, value: cfg.amount },
          description: cfg.name,
          custom_id: packCustomId(plan, body.userId)
        }]
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: 'PayPal order create failed', detail: d });
    res.status(200).json({ id: d.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
