// "나에 대해 알려주세요" 폼 저장 — service_role 로 upsert
// row 없으면 생성, 있으면 업데이트. RLS / 누락 트리거 영향 받지 않음.
// 클라이언트 access_token 검증으로 본인 외 변조 방지.
const { createClient } = require('@supabase/supabase-js');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'POST only' });

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !serviceKey || !anonKey) {
    return res.status(500).json({ ok:false, error:'server_config_missing' });
  }

  // 1) Authorization 헤더에서 access_token 추출 후 사용자 검증
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ ok:false, error:'missing_token' });

  const sbAuth = createClient(url, anonKey);
  let user = null;
  try {
    const { data, error } = await sbAuth.auth.getUser(token);
    if (error || !data || !data.user) {
      return res.status(401).json({ ok:false, error:'invalid_token' });
    }
    user = data.user;
  } catch(e) {
    return res.status(401).json({ ok:false, error:'auth_check_failed' });
  }

  // 2) payload 검증 (phone 필수 + 형식)
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const phoneRaw = String(body.phone || '').trim();
  const phoneDigits = phoneRaw.replace(/\D/g, '');
  const ageNum = parseInt(body.age, 10);
  const region = String(body.region || '').trim();
  const email = String(body.email || user.email || '').trim();
  const edu = String(body.edu || '').trim();
  const applyExp = String(body.apply || '').trim();
  const engLevel = String(body.eng || '').trim();

  if (!name) return res.status(400).json({ ok:false, error:'name_required' });
  if (!phoneRaw || phoneDigits.length < 10) return res.status(400).json({ ok:false, error:'phone_invalid' });
  if (!ageNum || ageNum < 15 || ageNum > 80) return res.status(400).json({ ok:false, error:'age_invalid' });
  if (!region) return res.status(400).json({ ok:false, error:'region_required' });
  if (!edu) return res.status(400).json({ ok:false, error:'edu_required' });
  if (!applyExp) return res.status(400).json({ ok:false, error:'apply_required' });
  if (!engLevel) return res.status(400).json({ ok:false, error:'eng_required' });

  // 3) service_role 로 upsert — auth_id 충돌 시 update
  const sb = createClient(url, serviceKey);
  const now = new Date().toISOString();
  try {
    const payload = {
      auth_id: user.id,
      email,
      name,
      phone: phoneRaw,
      age: ageNum,
      region,
      edu,
      apply_exp: applyExp,
      eng_level: engLevel,
      updated_at: now
    };
    const { data, error } = await sb.from('users').upsert(payload, { onConflict: 'auth_id' }).select('id, phone').maybeSingle();
    if (error) {
      // age/region/edu/apply_exp/eng_level 컬럼 누락 환경 fallback — name/phone 만 저장
      console.warn('[save-profile] full upsert failed, fallback minimal:', error.message);
      const fallback = { auth_id: user.id, email, name, phone: phoneRaw, updated_at: now };
      const r2 = await sb.from('users').upsert(fallback, { onConflict: 'auth_id' }).select('id, phone').maybeSingle();
      if (r2.error) {
        console.error('[save-profile] fallback also failed:', r2.error.message);
        return res.status(500).json({ ok:false, error:'db_upsert_failed', detail: r2.error.message });
      }
      return res.json({ ok:true, partial:true, savedPhone: !!(r2.data && r2.data.phone) });
    }
    return res.json({ ok:true, savedPhone: !!(data && data.phone) });
  } catch (e) {
    console.error('[save-profile] exception:', e);
    return res.status(500).json({ ok:false, error: e.message || 'unknown' });
  }
};
