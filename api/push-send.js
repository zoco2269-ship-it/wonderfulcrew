const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const authHeader = req.headers.authorization || '';
  const adminKey = process.env.PUSH_ADMIN_KEY || 'wc-push-admin-2026';
  if (authHeader !== 'Bearer ' + adminKey) {
    return res.status(403).json({ error: 'unauthorized' });
  }

  const { title, body, url, tag } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });

  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'zoco2269@gmail.com'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: subs, error } = await sb.from('push_subscriptions').select('*').eq('active', true);

  if (error) return res.status(500).json({ error: error.message });

  const payload = JSON.stringify({ title, body, url: url || '/', tag: tag || 'wc-notification' });
  let sent = 0, failed = 0;

  for (const sub of (subs || [])) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth }
    };
    try {
      await webpush.sendNotification(pushSub, payload);
      sent++;
    } catch(e) {
      failed++;
      if (e.statusCode === 410 || e.statusCode === 404) {
        await sb.from('push_subscriptions').update({ active: false }).eq('endpoint', sub.endpoint);
      }
    }
  }

  res.json({ ok: true, sent, failed, total: (subs || []).length });
};
