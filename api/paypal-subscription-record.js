// Verify a just-approved PayPal subscription and record it to Supabase (Basic / Elite monthly).
const { apiBase, getAccessToken, recordPayment } = require('./_paypal.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const { subscriptionID, plan, userId, email, name } = body;
  if (!subscriptionID) return res.status(400).json({ error: 'subscriptionID required' });

  try {
    const token = await getAccessToken();
    const r = await fetch(apiBase() + `/v1/billing/subscriptions/${subscriptionID}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: 'PayPal subscription fetch failed', detail: d });
    // ACTIVE = billing started; APPROVED = approved, activation imminent (webhook will confirm)
    if (d.status !== 'ACTIVE' && d.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Subscription not active', status: d.status });
    }

    const amount = (d.billing_info && d.billing_info.last_payment && d.billing_info.last_payment.amount &&
                    d.billing_info.last_payment.amount.value) || '0';

    const result = await recordPayment({
      userId, email, name,
      plan: plan || 'basic',
      tid: subscriptionID,
      moid: subscriptionID,
      amount
    });

    res.status(200).json({ ok: true, status: d.status, ...result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
