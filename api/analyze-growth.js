// 사용자의 practice_records 를 AI 로 분석해 약점·강점·추세 반환
// POST { userId?, email? } → { ok, weakAreas, strongAreas, trend, sampleSize }
const { createClient } = require('@supabase/supabase-js');

const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You are a cabin crew interview coach analyzing a candidate's growth log over multiple practice sessions. Identify weak-recurring patterns (서비스 마인드, 유창성, 롤플레이 대응, 공감, 솔루션 구체성, 끝맺음 등) and any improvement. Return STRICTLY this JSON:
{
  "weakAreas": [{"area":"서비스 마인드","evidence":"<직접 인용된 피드백 한 줄>","period":"YYYY-MM-DD ~ YYYY-MM-DD","recoveryNote":"<나아진 시기 / 아직 약함>"}],
  "strongAreas": [{"area":"...","evidence":"..."}],
  "trend":"<전반적 추세 한 문단, 한국어, 따뜻하지만 솔직하게>"
}
Return ONLY JSON. No markdown fences.`;

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let { userId, email } = req.body || {};
  userId = userId ? String(userId).trim() : '';
  email = email ? String(email).trim().toLowerCase() : '';
  if (!userId && !email) {
    return res.status(400).json({ error: 'userId or email required' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'supabase env missing' });
  }
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // email 만 받은 경우 → auth_id 조회
    if (!userId) {
      const { data: u } = await sb.from('users')
        .select('auth_id')
        .ilike('email', email)
        .maybeSingle();
      if (!u || !u.auth_id) {
        return res.status(404).json({ error: 'user not found', email });
      }
      userId = u.auth_id;
    }

    // practice_records 조회
    const { data: records, error: prErr } = await sb.from('practice_records')
      .select('created_at, stage, airline, score, feedback')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (prErr) {
      console.error('[analyze-growth] supabase error:', prErr);
      return res.status(500).json({ error: prErr.message });
    }

    if (!records || records.length === 0) {
      return res.json({ ok: true, empty: true });
    }

    // 압축 요약 빌드
    const lines = records.map(r => {
      const date = (r.created_at || '').slice(0, 10);
      const stage = r.stage || '?';
      const score = (r.score === null || r.score === undefined) ? '-' : r.score;
      const fb = String(r.feedback || '').replace(/\s+/g, ' ').slice(0, 300);
      return `[${date}] stage: ${stage} | score: ${score} | feedback: ${fb}`;
    });
    const userMessage = `다음은 사용자의 최근 ${records.length}개 연습 기록입니다 (최신 → 과거 순):\n\n${lines.join('\n')}`;

    // Anthropic 호출
    const anthResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    });
    const anthData = await anthResp.json();
    if (!anthResp.ok) {
      console.error('[analyze-growth] anthropic error:', anthData);
      return res.status(500).json({ error: 'anthropic error', detail: anthData });
    }

    const rawText = (anthData.content && anthData.content[0] && anthData.content[0].text) || '';

    // JSON 파싱 (markdown 펜스 방어)
    let parsed = null;
    try {
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // 본문 안 어딘가 JSON 만 추출 시도
      const m = rawText.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch (e2) { parsed = null; }
      }
    }

    if (!parsed) {
      return res.json({
        ok: true,
        trend: rawText,
        sampleSize: records.length
      });
    }

    return res.json({
      ok: true,
      weakAreas: parsed.weakAreas || [],
      strongAreas: parsed.strongAreas || [],
      trend: parsed.trend || '',
      sampleSize: records.length
    });
  } catch (e) {
    console.error('[analyze-growth] error:', e);
    return res.status(500).json({ error: e.message });
  }
};
