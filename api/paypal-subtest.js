// Temporary diagnostic: create a subscription SERVER-SIDE for the basic plan,
// and return PayPal's EXACT response/error. This tells us definitively whether the
// account can create subscriptions (and if not, the precise reason).
const { apiBase, getAccessToken } = require('./_paypal.js');

module.exports = async function handler(req, res) {
  try {
    const token = await getAccessToken();
    const planId = process.env.PAYPAL_PLAN_BASIC;
    const r = await fetch(apiBase() + '/v1/billing/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ plan_id: planId })
    });
    const d = await r.json();
    // Return status + the meaningful bits of PayPal's response.
    res.status(200).json({
      httpStatus: r.status,
      ok: r.ok,
      subscriptionStatus: d.status,
      id: d.id,
      name: d.name,
      message: d.message,
      details: d.details,
      links: (d.links || []).map(l => ({ rel: l.rel, href: (l.href || '').split('?')[0] })),
      debug_id: d.debug_id
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
