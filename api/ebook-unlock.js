// 무료 라이브 완주자 전용 전자책 잠금 해제 (ebook.html에서 호출)
// 라이브 마지막에 공개한 코드를 맞히면 그 자리에서 바로 다운로드 링크를 내려준다 (이메일 발송 없음).
// 코드/파일 링크는 Supabase가 아니라 api/_ebook-config.js 에서 직접 관리한다 — 새 테이블 생성 불필요.
const { createClient } = require('@supabase/supabase-js');
const config = require('./_ebook-config.js');

function clip(v, n) { return (typeof v === 'string' ? v : '').trim().slice(0, n); }

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

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

  if (!config.active || !config.code) {
    return res.status(400).json({ ok: false, error: 'not_open' });
  }
  if (String(code).trim().toUpperCase() !== String(config.code).trim().toUpperCase()) {
    return res.status(401).json({ ok: false, error: 'wrong_code' });
  }
  if (!config.fileUrl) {
    return res.status(500).json({ ok: false, error: 'file_not_ready' });
  }

  // 다운로드 로그 — 기존 feedback 테이블에 남긴다 (새 테이블 불필요, 실패해도 발급은 진행)
  try {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (url && serviceKey) {
      const db = createClient(url, serviceKey);
      await db.from('feedback').insert({
        name, email, type: '전자책 다운로드',
        content: '[전자책] ' + (config.title || '합격 비법 전자책') + ' · phone:' + phone + ' · code:' + code,
        at: new Date().toISOString()
      });
    }
  } catch (e) { console.warn('[ebook-unlock] log insert failed:', e.message); }

  res.status(200).json({ ok: true, downloadUrl: config.fileUrl, title: config.title || '합격 비법 전자책' });
};
