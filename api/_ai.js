// AI 프록시 — Anthropic API 호출 + 서버 사이드 프롬프트 레지스트리.
//
// 두 가지 호출 방식 지원:
//
// (A) 레거시 직접 호출 (기존 페이지들):
//     body: { system: '...', model: '...', max_tokens: N, messages: [...] }
//     → 그대로 Anthropic으로 전달.
//
// (B) prompt_key 호출 (신규 — IP 보호):
//     body: { prompt_key: 'discussion2_feedback_en',
//             vars: { scenario: '...', scope_note: '...' },
//             messages: [...] }
//     → 서버 _prompts.js 레지스트리에서 system/model/max_tokens 주입 후 Anthropic 호출.
//     → 시스템 프롬프트가 클라이언트로 절대 노출되지 않음.

const { resolvePrompt } = require('./_prompts');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    // 클라이언트 body 복사 (mutation 방지)
    const body = Object.assign({}, req.body || {});

    // prompt_key 가 있으면 서버 레지스트리에서 시스템 프롬프트 주입
    if (body.prompt_key) {
      const resolved = resolvePrompt(body.prompt_key, body.vars || {});
      if (!resolved) {
        return res.status(400).json({ error: 'unknown prompt_key: ' + body.prompt_key });
      }
      body.system = resolved.system;
      if (!body.model && resolved.model) body.model = resolved.model;
      if (!body.max_tokens && resolved.max_tokens) body.max_tokens = resolved.max_tokens;
      delete body.prompt_key;
      delete body.vars;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    // 신형 모델은 응답 앞에 thinking 블록이 붙을 수 있음 → 기존 페이지들의 content[0].text 파싱이 깨짐.
    // 텍스트 블록만 남겨 하위호환 유지 (텍스트가 하나도 없으면 원본 유지).
    if (data && Array.isArray(data.content)) {
      const textBlocks = data.content.filter(b => b && b.type === 'text');
      if (textBlocks.length) data.content = textBlocks;
    }
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
