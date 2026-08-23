// 무료 라이브 완주자 전용 전자책 잠금 해제 (ebook.html에서 호출)
// 라이브 마지막에 공개한 코드를 맞히면 다운로드 링크 노출 + 이메일 자동 발송.
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

  // 이메일 자동 발송 (Resend) — 실패해도 화면 다운로드는 그대로 제공
  const resendKey = process.env.RESEND_API_KEY;
  const verified = process.env.EMAIL_DOMAIN_VERIFIED === '1';
  const fromEmail = verified ? (process.env.FROM_EMAIL || 'noreply@wonderfulcrew.com') : 'onboarding@resend.dev';
  if (resendKey && verified) {
    const esc = (s) => String(s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    const html =
      '<div style="font-family:sans-serif;font-size:15px;line-height:1.8;color:#222;max-width:520px;">' +
      '<h2 style="color:#1A2340;">전자책이 도착했어요 📘</h2>' +
      '<p><b>' + esc(name) + '</b>님, 라이브 완주 축하드려요! 약속드린 <b>' + esc(title) + '</b>을 보내드립니다.</p>' +
      '<p style="margin:20px 0;"><a href="' + downloadUrl + '" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#E8C96A,#C9A84C);color:#fff;border-radius:24px;text-decoration:none;font-weight:600;">전자책 다운로드</a></p>' +
      '<p style="color:#888;font-size:13px;margin-top:24px;">원더풀크루 · wonderfulcrew.com</p></div>';
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: '원더풀크루 <' + fromEmail + '>', to: email, subject: '[원더풀크루] ' + title + ' 다운로드', html })
    }).catch((e) => console.warn('[ebook-unlock] resend err:', e.message));
  }

  res.status(200).json({ ok: true, downloadUrl, title });
};
