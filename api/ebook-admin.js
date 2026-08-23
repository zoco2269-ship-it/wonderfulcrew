// 전자책 코드/다운로드 링크 관리 (admin-ebook.html에서 호출)
// GET: 현재 설정 + 발급 건수 조회, POST: 새 라이브용 코드/파일 링크 세팅
const { createClient } = require('@supabase/supabase-js');

function clip(v, n) { return (typeof v === 'string' ? v : '').trim().slice(0, n); }

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization || '';
  const adminKey = process.env.PUSH_ADMIN_KEY || 'wc-push-admin-2026';
  if (authHeader !== 'Bearer ' + adminKey) {
    return res.status(403).json({ error: 'unauthorized' });
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return res.status(500).json({ error: 'server_config_missing' });
  const db = createClient(url, serviceKey);

  if (req.method === 'GET') {
    try {
      const { data: config } = await db.from('ebook_config').select('*').eq('id', 1).maybeSingle();
      const { count } = await db.from('ebook_unlocks').select('*', { count: 'exact', head: true });
      return res.status(200).json({ ok: true, config: config || null, unlockCount: count || 0 });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST only' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const code = clip(body.code, 40);
  const fileUrl = clip(body.fileUrl, 500);
  const title = clip(body.title, 120) || '합격 비법 전자책';
  const active = body.active !== false;

  if (!code) return res.status(400).json({ ok: false, error: 'code required' });

  try {
    const { error } = await db.from('ebook_config').upsert({
      id: 1, code, file_url: fileUrl, title, active, updated_at: new Date().toISOString()
    });
    if (error) throw error;
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
