// One-time setup: creates (or finds) the PayPal webhook pointing to /api/paypal-webhook.
// Run AFTER live/sandbox credentials are set. Returns the webhook id to put in PAYPAL_WEBHOOK_ID.
//   POST /api/paypal-setup-webhook            -> uses default URL https://www.wonderfulcrew.com/api/paypal-webhook
//   POST { "url": "https://.../api/paypal-webhook" }  -> override the target URL
// If a webhook already exists for that URL, its id is returned (no duplicate created).
const { apiBase, getAccessToken } = require('./_paypal.js');

const EVENTS = [
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'PAYMENT.SALE.COMPLETED',
  'PAYMENT.CAPTURE.COMPLETED',
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.EXPIRED',
  'BILLING.SUBSCRIPTION.SUSPENDED'
].map(function (t) { return { name: t }; });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only — call this once to create the webhook' });

  const setupKey = process.env.PAYPAL_SETUP_KEY;
  if (setupKey && req.headers['x-setup-key'] !== setupKey) {
    return res.status(401).json({ error: 'invalid setup key' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const url = body.url || 'https://www.wonderfulcrew.com/api/paypal-webhook';

  try {
    const token = await getAccessToken();

    // 1) If a webhook for this URL already exists, return it (PayPal rejects duplicates).
    const listR = await fetch(apiBase() + '/v1/notifications/webhooks', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const listD = await listR.json();
    if (listR.ok && Array.isArray(listD.webhooks)) {
      const existing = listD.webhooks.find(function (w) { return w.url === url; });
      if (existing) {
        return res.status(200).json({ ok: true, existing: true, PAYPAL_WEBHOOK_ID: existing.id, url: url });
      }
    }

    // 2) Create it.
    const r = await fetch(apiBase() + '/v1/notifications/webhooks', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, event_types: EVENTS })
    });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: 'webhook create failed', detail: d });

    res.status(200).json({
      ok: true,
      PAYPAL_WEBHOOK_ID: d.id,
      url: url,
      next: 'Copy PAYPAL_WEBHOOK_ID into your Vercel env vars, then redeploy.'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
