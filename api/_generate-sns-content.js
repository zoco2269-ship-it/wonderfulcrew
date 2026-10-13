// SNS 마케팅 콘텐츠 자동 생성 — Claude 가 페르소나·토픽 다양화해서 큐 채움
// Vercel cron 매일 1회 + admin 수동 트리거 모두 지원
// 출력 → Supabase sns_content_queue 테이블 (status='pending')
const { createClient } = require('@supabase/supabase-js');

// 페르소나 (계정 톤별)
const PERSONAS = [
  { id: 'coach', name: '7년차 에미레이트 출신 코치', voice: '냉정한 인사이트·차분한 톤·합격 비밀 공개' },
  { id: 'mentor', name: '13년 경력 면접 멘토', voice: '따뜻한 응원·구체적 조언·합격 사례 인용' },
  { id: 'success', name: '합격생 후기', voice: '생생한 1인칭 후기·실수담·합격 직전 마음가짐' },
  { id: 'data', name: '데이터 인사이트', voice: '숫자 기반·통계 후킹·트렌드 분석 톤' },
];

// 토픽 — 사실 기반 + 검색 의도 충족. 자극적 클릭베이트 X.
const TOPICS = [
  // 외항사
  '에미레이트 항공 면접 핵심 준비 포인트',
  '카타르 항공 워드슈팅·센텐스슈팅 영어 패턴',
  '싱가폴항공 그루밍 기준 (헤어·메이크업·복장)',
  '캐세이퍼시픽 비디오 인터뷰 답변 구조',
  '에티하드 항공 면접 단계별 정리',
  '플라이두바이 한국 채용 진행 방식',
  '핀에어 한국인 채용 일정 안내',
  // 국내
  '대한항공 영상면접 답변 구성 가이드',
  '아시아나 면접 단계별 준비 (서류·실무·임원·체력)',
  '아시아나 수영 25m 미리 준비하는 방법',
  '제주항공 역량검사 + 면접 흐름',
  '진에어 자기소개서 작성 핵심',
  '티웨이항공 면접 자주 나오는 질문',
  // 진로·연봉
  '외항사 승무원 연봉 구조 (기본급·비과세·수당)',
  '국내 LCC 승무원 채용 트렌드',
  '승무원 준비 시기·기간 가이드',
  '항공사별 키·암리치·문신 기준 정리',
  '외항사 영어 면접 실제 수준 안내',
  // 면접 기술
  'CV Drop 첫 인사 자연스럽게 시작하는 법',
  'Open Day 그룹 토론 발언 매너',
  '면접 첫 인상에서 면접관이 보는 디테일',
  'STAR method 답변 구조 활용법',
  '4Ds 술 취한 손님 응대 단계',
  'LEAP 화난 손님 응대 스킬',
  // 그루밍·이미지
  '승무원 면접 헤어 번 깔끔하게 만드는 법',
  '승무원 면접 메이크업 가이드',
  '항공사별 면접복 정장 컬러 안내',
  // 트렌드
  '2026년 외항사 채용 동향',
  '리야드 에어 신규 채용 정보',
  'AI 면접 코치로 무료 연습 시작하기',
];

// 후킹 — 과장·자극 표현 자제, 정확·전문가 톤
const HOOKS = [
  '면접관 시각으로 본', '7년차 일등석 출신이 정리한', '합격생 데이터로 정리한',
  '항공사가 실제로 보는', '핵심만 정리한', '오해하기 쉬운',
  '준비 단계별', '꼭 알아야 할',
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 인증: Vercel cron, admin email, 또는 secret token
  const cronSecret = process.env.CRON_SECRET || '';
  const authHeader = req.headers && (req.headers.authorization || req.headers['x-cron-secret'] || '');
  const isVercelCron = req.headers && req.headers['user-agent'] && req.headers['user-agent'].indexOf('vercel-cron') !== -1;
  const adminEmail = (req.body && req.body.adminEmail) || (req.query && req.query.adminEmail) || '';
  const ADMIN_EMAILS = ['zoco2269@gmail.com', 'guswn5164@gmail.com'];
  const isAuthed = isVercelCron ||
    (cronSecret && authHeader.indexOf(cronSecret) !== -1) ||
    ADMIN_EMAILS.indexOf(adminEmail) !== -1;
  if (!isAuthed) return res.status(403).json({ error: 'unauthorized' });

  const count = parseInt((req.body && req.body.count) || (req.query && req.query.count) || '5', 10);
  const lang = (req.body && req.body.lang) || (req.query && req.query.lang) || 'ko'; // ko or en
  const format = (req.body && req.body.format) || (req.query && req.query.format) || 'thread'; // thread | tweet | card_series | reel_script
  const FORMAT_SPECS = {
    thread:       { name: 'Threads/Facebook', maxLen: 500, structure: '후킹 첫줄 + 본문 3~5줄 + 링크 + 해시태그' },
    tweet:        { name: 'X/Twitter',         maxLen: 240, structure: '강한 후킹 + 핵심 1줄 + 링크 + 해시태그 (한 트윗)' },
    card_series:  { name: '인스타 카드뉴스 5장', maxLen: 800, structure: '5장 슬라이드 (각 슬라이드 1줄 큰 제목 + 1~2줄 본문). JSON 의 text 안에 [SLIDE 1], [SLIDE 2]... 마커로 분리' },
    reel_script:  { name: '인스타 릴스/유튜브 쇼츠 30초 스크립트', maxLen: 600, structure: '0~3초 후킹 + 4~25초 본문 + 26~30초 CTA. 시각·자막·말투 가이드 포함' }
  };
  const spec = FORMAT_SPECS[format] || FORMAT_SPECS.thread;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing' });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // sns_content_queue 테이블 자동 생성 시도 (이미 있으면 무시)
  // 테이블 없으면 사용자가 수동 SQL 실행 필요
  const generated = [];
  const errors = [];

  for (let i = 0; i < Math.min(count, 50); i++) {
    try {
      const persona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
      const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      const hook = HOOKS[Math.floor(Math.random() * HOOKS.length)];

      const systemPrompt = lang === 'en'
        ? `You are a Korean cabin crew interview coach writing English SNS posts. Voice: ${persona.voice}. Output STRICT JSON.

CRITICAL RULES:
- FACT-BASED ONLY. Do NOT invent statistics (e.g. "60% of evaluation"). Do NOT make up percentages.
- Do NOT exaggerate or use clickbait ("only 30 seconds", "the secret no one tells you").
- Do NOT redefine technical tests as "psychology" or vice versa. Swimming test is a swimming test, not a psychology test.
- Use respectful, professional tone befitting a 7-year first-class cabin crew coach.
- Avoid casual slang. Maintain the dignified, accurate voice of an industry professional.`
        : `너는 한국 외항사·국내항공사 승무원 면접 전문 코치다. 페르소나: ${persona.name}. 톤: ${persona.voice}. 출력은 반드시 STRICT JSON.

★ 절대 규칙 (위반 시 콘텐츠 가치 0):
- 사실 기반만 작성. 근거 없는 통계 (예: "평가점수의 60%", "면접관 70%가...", "합격률 62%") 절대 금지.
- 가짜 히스토리·통계 금지: "지난 3년간 분석한 결과", "데이터로 보면 X%" 같은 검증 안 된 문구 절대 X.
- 과장·자극 표현 금지 ("단 30초만에", "심리가 전부", "이거 하나면 합격", "비법" 등).
- 자극적 메타포·격언풍 표현 절대 금지: "완벽함은 독", "X는 함정", "노력은 배신", "X일수록 X하라", "X 때문에 X 한다" 같은 어록·트위터 명언 스타일 금지. 차분한 정보 전달 톤만.
- "절대 알려주지 않는", "X의 비결", "X의 비밀", "충격적 사실" 같은 클릭베이트 어구 절대 금지.
- 가공된 정량 절대 금지: "정수리 5cm 아래", "60% 차지", "30초만에 완성" 같이 검증 안 된 숫자 X. 정확히 아는 수치만 (예: 키 160cm 이상은 카타르 항공 공식 기준).
- 광고스러운 톤 금지. "팁 1️⃣ 2️⃣" 식 클릭베이트 리스트보다 자연스러운 정보 전달.
- placeholder 절대 금지: "OO항공", "X 항공사", "○○" 같은 가짜 변수 표기 X. 모르면 항공사 이름 자체를 빼라.
- 항공사 이름은 정확하게만 (에미레이트 / 카타르 / 싱가폴 / 캐세이퍼시픽 / 대한항공 / 아시아나 / 진에어 / 티웨이 / 제주항공 등 실명).
- 기술적 평가를 심리화하지 마라. 수영 테스트는 수영 실력 평가, 영어 시험은 영어 평가. 사실 왜곡 금지.
- 한자 절대 사용 금지 (한국 콘텐츠는 한글만). 영어 외래어는 영문 그대로 OK.
- 격조 있는 어휘 사용. "꿀팁", "써먹다", "통하는", "비법" 같은 캐주얼 표현 금지.
- 7년차 일등석 출신 코치의 품위 있고 정확한 톤 유지.
- 콘텐츠는 짧고 명확하게 — 모르는 정보는 차라리 빼고, 아는 사실만 깊이 있게.`;

      const userPrompt = lang === 'en'
        ? `Format: ${spec.name}. Max length: ${spec.maxLen} chars. Structure: ${spec.structure}.
Topic: "${topic}". Hook word: "${hook}". Include emoji. End with: "👉 Try free AI mock interview: wonderfulcrew.com"

JSON only:
{"text":"...","title_short":"...","hashtags":["..."]}`
        : `포맷: ${spec.name}. 최대 길이: ${spec.maxLen}자. 구조: ${spec.structure}
주제: "${topic}". 후킹 단어: "${hook}". 이모지 포함. 끝에: "👉 무료 AI 모의면접: wonderfulcrew.com"

규칙:
- 외운 티 안 나는 자연스러운 톤
- 면접관/합격생 시각의 정확한 인사이트
- 끝에 wonderfulcrew.com 링크
- 해시태그 4-6개 (#승무원 #외항사 등)
- ★ 사실 기반만. 근거 없는 % 통계, 가공된 시간(30초만에 등), 자극적 후킹 절대 금지.
- ★ 한자 사용 금지. 한글 + 영어(영문 OK)만.
- ★ "꿀팁/비법/통하는" 같은 가벼운 어휘 X. 격조 있게.
- ★ 기술적 사실 왜곡 X (수영 = 수영 실력, 영어 시험 = 영어 시험).
- ★ 자극 명언 금지: "완벽함은 독", "X는 함정", "X일수록 X하라" 같은 격언풍·트위터어록 X.
- ★ title_short (카드용 짧은 제목) 도 같은 규칙 — 자극 카피 X. 주제 그대로 명확하게 (예: "카타르 워드슈팅 답변 패턴", "에미레이트 면접 단계 정리").
${format === 'card_series' ? '- 카드 5장: [SLIDE 1] ~ [SLIDE 5] 마커로 구분. 각 슬라이드 1줄 굵은 제목 + 1~2줄 본문' : ''}
${format === 'reel_script' ? '- 30초 쇼츠 스크립트: 시간 마커 + 멘트 + (시각 가이드)' : ''}

JSON 만:
{"text":"...","title_short":"카드뉴스용 짧은 제목 20자","hashtags":["승무원","외항사"]}`;

      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });
      const aiData = await aiRes.json();
      const raw = aiData?.content?.[0]?.text || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { errors.push('no JSON: ' + raw.slice(0, 100)); continue; }
      let parsed;
      try { parsed = JSON.parse(jsonMatch[0]); }
      catch (e) { errors.push('parse fail: ' + e.message); continue; }

      const record = {
        text: parsed.text || '',
        title_short: parsed.title_short || topic.slice(0, 30),
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(h => h.startsWith('#') ? h : '#' + h).join(' ') : '',
        topic: topic,
        persona: persona.id,
        lang: lang,
        format: format,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      try {
        await sb.from('sns_content_queue').insert(record);
        generated.push({ topic: topic, persona: persona.id, text_preview: record.text.slice(0, 60) });
      } catch (e) {
        errors.push('insert fail: ' + e.message);
      }
    } catch (e) {
      errors.push('exception: ' + e.message);
    }
  }

  return res.json({
    ok: true,
    generated_count: generated.length,
    error_count: errors.length,
    samples: generated.slice(0, 3),
    errors: errors.slice(0, 5),
    note: 'Supabase 에 sns_content_queue 테이블이 없으면 SQL 마이그레이션 필요. README 참고.',
  });
};
