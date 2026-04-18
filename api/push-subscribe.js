const { createClient } = require('@supabase/supabase-js');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { subscription, userId, email } = req.body || {};
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'subscription required' });
  }

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { error } = await sb.from('push_subscriptions').upsert({
    endpoint: subscription.endpoint,
    keys_p256dh: subscription.keys ? subscription.keys.p256dh : '',
    keys_auth: subscription.keys ? subscription.keys.auth : '',
    user_id: userId || null,
    email: email || null,
    subscribed_at: new Date().toISOString(),
    active: true
  }, { onConflict: 'endpoint' });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
};
