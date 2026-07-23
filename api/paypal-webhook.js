// PayPal webhook — the reliable source of truth for recurring renewals + cancellations.
// Configure the webhook in the PayPal dashboard pointing to /api/paypal-webhook and set
// PAYPAL_WEBHOOK_ID env var. Subscribe to at least:
//   BILLING.SUBSCRIPTION.ACTIVATED, PAYMENT.SALE.COMPLETED,
//   BILLING.SUBSCRIPTION.CANCELLED, BILLING.SUBSCRIPTION.EXPIRED, BILLING.SUBSCRIPTION.SUSPENDED,
//   PAYMENT.CAPTURE.COMPLETED
const { apiBase, getAccessToken, recordPayment, deactivateSubscription, parseCustomId } = require('./_paypal.js');

async function verify(req, event) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    // Not configured yet. Only tolerate this in sandbox (dev); never process unverified events in live.
    if ((process.env.PAYPAL_MODE || 'sandbox') !== 'live') return true;
    return false;
  }
  try {
    const token = await getAccessToken();
    const r = await fetch(apiBase() + '/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transmission_id: req.headers['paypal-transmission-id'],
        transmission_time: req.headers['paypal-transmission-time'],
        cert_url: req.headers['paypal-cert-url'],
        auth_algo: req.headers['paypal-auth-algo'],
        transmission_sig: req.headers['paypal-transmission-sig'],
        webhook_id: webhookId,
        webhook_event: event
      })
    });
    const d = await r.json();
    return d.verification_status === 'SUCCESS';
  } catch (e) {
    console.error('[paypal-webhook] verify error:', e.message);
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let event = req.body;
  if (typeof event === 'string') { try { event = JSON.parse(event); } catch { event = {}; } }
  event = event || {};

  const ok = await verify(req, event);
  if (!ok) { console.warn('[paypal-webhook] verification failed / not configured'); return res.status(400).json({ error: 'verification failed' }); }

  const type = event.event_type || '';
  const resource = event.resource || {};

  try {
    if (type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const { plan, userId } = parseCustomId(resource.custom_id);
      await recordPayment({ userId, email: '', name: '', plan: plan || 'basic', tid: resource.id, moid: resource.id, amount: '0' });
    } else if (type === 'PAYMENT.SALE.COMPLETED') {
      // recurring subscription payment — extend by one month
      const subId = resource.billing_agreement_id;
      const { plan, userId } = parseCustomId(resource.custom_id);
      if (subId) {
        await recordPayment({
          userId, email: '', name: '',
          plan: plan || 'basic',
          tid: resource.id,
          moid: resource.id, // each sale has a unique id -> renewal recorded once
          amount: (resource.amount && resource.amount.total) || '0'
        });
      }
    } else if (type === 'PAYMENT.CAPTURE.COMPLETED') {
      const { plan, userId } = parseCustomId(resource.custom_id);
      await recordPayment({
        userId, email: '', name: '',
        plan: plan || 'premium',
        tid: resource.id,
        moid: resource.id,
        amount: (resource.amount && resource.amount.value) || '0'
      });
    } else if (type === 'BILLING.SUBSCRIPTION.CANCELLED' ||
               type === 'BILLING.SUBSCRIPTION.EXPIRED' ||
               type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      const { userId } = parseCustomId(resource.custom_id);
      await deactivateSubscription({ userId });
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[paypal-webhook] handler error:', e.message);
    res.status(200).json({ ok: false, error: e.message }); // 200 so PayPal doesn't retry-storm on our bug
  }
};
