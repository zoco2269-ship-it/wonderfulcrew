// 무료 라이브 완주자 전용 전자책 잠금 해제 (ebook.html에서 호출)
// 라이브 마지막에 공개한 코드를 맞히면 그 자리에서 바로 다운로드 링크를 내려준다 (이메일 발송 없음).
// Supabase 테이블 필요 (supabase-schema.sql 참고): ebook_config, ebook_unlocks
const { createClient } = require('@supabase/supabase-js');

function clip(v, n) { return (typeof v === 'string' ? v : '').trim().slice(0, n); }

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return res.status(500).json({ ok: false, error: 'server_config_missing' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const name = clip(body.name, 80);
  const phone = clip(body.phone, 40);
  const email = clip(body.email, 120);
  const code = clip(body.code, 40);

  if (!name || !phone || !email || !code) {
    return res.status(400).json({ ok: false, error: 'all fields required' });
  }

  const db = createClient(url, serviceKey);

  let config;
  try {
    const { data, error } = await db.from('ebook_config').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    config = data;
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'config_lookup_failed' });
  }

  if (!config || !config.active || !config.code) {
    return res.status(400).json({ ok: false, error: 'not_open' });
  }
  if (String(code).trim().toUpperCase() !== String(config.code).trim().toUpperCase()) {
    return res.status(401).json({ ok: false, error: 'wrong_code' });
  }
  if (!config.file_url) {
    return res.status(500).json({ ok: false, error: 'file_not_ready' });
  }

  // 다운로드 로그 (실패해도 발급 자체는 진행)
  try {
    await db.from('ebook_unlocks').insert({ name, phone, email, code_used: code });
  } catch (e) { console.warn('[ebook-unlock] log insert failed:', e.message); }

  const title = config.title || '합격 비법 전자책';
  const downloadUrl = config.file_url;

  res.status(200).json({ ok: true, downloadUrl, title });
};
