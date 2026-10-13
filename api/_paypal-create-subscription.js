// Create a PayPal subscription SERVER-SIDE and return its id for the smart button.
// (Server-side creation is the reliable path — the smart button then uses the
//  subscription's own approval link instead of the hermes flow.)
const { apiBase, getAccessToken, packCustomId } = require('./_paypal.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const plan = body.plan === 'elite' ? 'elite' : 'basic';
  const planId = plan === 'elite' ? process.env.PAYPAL_PLAN_ELITE : process.env.PAYPAL_PLAN_BASIC;
  if (!planId) return res.status(400).json({ error: 'This subscription plan is not set up yet.' });

  try {
    const token = await getAccessToken();
    const r = await fetch(apiBase() + '/v1/billing/subscriptions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: packCustomId(plan, body.userId || body.email || '')
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: 'subscription create failed', detail: d });
    res.status(200).json({ id: d.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
