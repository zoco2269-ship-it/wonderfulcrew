// Temporary diagnostic: checks that the live billing plans in env actually exist & are ACTIVE
// under the same account as PAYPAL_CLIENT_ID. Reads env only, returns no secrets.
const { apiBase, getAccessToken } = require('./_paypal.js');

module.exports = async function handler(req, res) {
  try {
    const token = await getAccessToken();
    const out = {
      mode: process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox',
      clientIdTail: (process.env.PAYPAL_CLIENT_ID || '').slice(-6)
    };
    const ids = { basic: process.env.PAYPAL_PLAN_BASIC, elite: process.env.PAYPAL_PLAN_ELITE };
    for (const k of Object.keys(ids)) {
      const id = ids[k];
      if (!id) { out[k] = { error: 'no plan id in env' }; continue; }
      const r = await fetch(apiBase() + '/v1/billing/plans/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
      const d = await r.json();
      out[k] = r.ok
        ? { id: d.id, status: d.status, product_id: d.product_id, name: d.name }
        : { httpStatus: r.status, error: d.name || d.message || d };
    }
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
