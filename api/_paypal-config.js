// Public PayPal config for the client (client-id + plan ids are NOT secret).
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    mode: process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox',
    currency: 'USD',
    planBasic: process.env.PAYPAL_PLAN_BASIC || '',
    planElite: process.env.PAYPAL_PLAN_ELITE || ''
  });
};
