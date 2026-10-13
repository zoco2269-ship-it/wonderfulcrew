// Capture a one-time PayPal order and record it to Supabase (Premium package).
const { PLANS, apiBase, getAccessToken, recordPayment } = require('./_paypal.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const { orderID, plan, userId, email, name } = body;
  if (!orderID) return res.status(400).json({ error: 'orderID required' });
  const thePlan = plan || 'premium';

  try {
    const token = await getAccessToken();
    const r = await fetch(apiBase() + `/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: 'PayPal capture failed', detail: d });
    if (d.status !== 'COMPLETED') return res.status(400).json({ error: 'Order not completed', status: d.status });

    const cap = d.purchase_units && d.purchase_units[0] &&
                d.purchase_units[0].payments && d.purchase_units[0].payments.captures &&
                d.purchase_units[0].payments.captures[0];
    const amount = (cap && cap.amount && cap.amount.value) || (PLANS[thePlan] && PLANS[thePlan].amount) || '0';

    const result = await recordPayment({
      userId, email, name,
      plan: thePlan,
      tid: (cap && cap.id) || orderID,
      moid: orderID,
      amount
    });

    res.status(200).json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
