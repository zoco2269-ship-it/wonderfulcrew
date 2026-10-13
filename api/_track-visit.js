// 로그인 사용자의 페이지 방문 기록 — 환불 분쟁 시 "이용 시작" 입증용
const { createClient } = require('@supabase/supabase-js');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { userId, email, page } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  try {
    await sb.from('page_visits').insert({
      user_id: userId,
      email: email || '',
      page: page || ''
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('[track-visit] error:', e);
    res.status(500).json({ error: e.message });
  }
};
