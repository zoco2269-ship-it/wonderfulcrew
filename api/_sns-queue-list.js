// SNS 콘텐츠 큐 조회 — admin 전용 (service-role 사용)
// admin 페이지에서 호출. anon key + RLS 우회.
const { createClient } = require('@supabase/supabase-js');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const adminEmail = (req.body && req.body.adminEmail) || (req.query && req.query.adminEmail) || '';
  const ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];
  if (ADMIN_EMAILS.indexOf(adminEmail) === -1) {
    return res.status(403).json({ error: 'unauthorized' });
  }

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // DELETE: ?id=N
  if (req.method === 'DELETE' || (req.method === 'POST' && req.query.action === 'delete')) {
    const id = req.query.id || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: 'id required' });
    const { error } = await sb.from('sns_content_queue').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, deleted: id });
  }

  // GET (default): list
  const limit = parseInt(req.query.limit || '20', 10);
  const status = req.query.status || ''; // 'pending' | 'posted' | 'failed' | ''
  let q = sb.from('sns_content_queue').select('*').order('created_at', { ascending: false }).limit(limit);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, count: (data || []).length, items: data || [] });
};
