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

// 토픽 (검색·바이럴 둘 다 강한 키워드)
const TOPICS = [
  // 외항사
  '에미레이트 항공 면접에서 절대 하면 안 되는 답변',
  '카타르 항공 워드슈팅 통과 비법',
  '싱가폴항공 그루밍 합격 체크리스트',
  '캐세이퍼시픽 비디오 인터뷰 합격 패턴',
  '에티하드 vs 에미레이트 어디가 더 쉬운가',
  '플라이두바이 한국인 합격 사례',
  '핀에어 한국인 채용 노하우',
  // 국내
  '대한항공 영상면접 합격 답변 톱 3',
  '아시아나 수영 25m 1개월 안에 통과하는 법',
  '제주항공 역량검사 함정 질문',
  '진에어 자기소개서 합격 패턴',
  '티웨이항공 면접 기출 질문',
  // 진로·연봉
  '외항사 승무원 실수령 연봉 (비과세 포함)',
  '국내 LCC 승무원 실제 연봉 비교',
  '승무원 학원 vs 독학, 진짜 차이',
  '승무원 키 / 암리치 / 문신 항공사별 기준',
  '승무원 영어 어느 정도면 합격하나',
  // 면접 기술
  'CV Drop 첫 30초 합격 멘트 5가지',
  'Open Day 그룹 토론 발언 타이밍',
  '면접관이 보는 첫인상 디테일',
  'STAR method 합격 답변 구조',
  '4D\'s 술 취한 손님 대응법',
  'LEAP 화난 손님 응대 스킬',
  // 그루밍·이미지
  '면접 헤어 번 30초 만에 완성',
  '승무원 면접 메이크업 합격 vs 탈락',
  '면접복 정장 컬러 항공사별',
  // 트렌드
  '2026년 외항사 채용 일정 총정리',
  '리야드 에어 신규 채용 첫 한국인 합격',
  'AI 면접 코치 무료로 24시간 연습하는 법',
];

const HOOKS = [
  '충격', '면접관이 절대 알려주지 않는', '99% 가 모르는', '7년차가 직접 알려주는',
  '합격생 1,000명 데이터로 본', '오늘 안에 끝내는', '단 30초만에', '이거 하나면 합격',
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
        ? `You are a Korean cabin crew interview coach writing English SNS posts. Voice: ${persona.voice}. Output STRICT JSON.`
        : `너는 한국 외항사·국내항공사 승무원 면접 전문 코치다. 페르소나: ${persona.name}. 톤: ${persona.voice}. 출력은 반드시 STRICT JSON.`;

      const userPrompt = lang === 'en'
        ? `Format: ${spec.name}. Max length: ${spec.maxLen} chars. Structure: ${spec.structure}.
Topic: "${topic}". Hook word: "${hook}". Include emoji. End with: "👉 Try free AI mock interview: wonderfulcrew.com"

JSON only:
{"text":"...","title_short":"...","hashtags":["..."]}`
        : `포맷: ${spec.name}. 최대 길이: ${spec.maxLen}자. 구조: ${spec.structure}
주제: "${topic}". 후킹 단어: "${hook}". 이모지 포함. 끝에: "👉 무료 AI 모의면접: wonderfulcrew.com"

규칙:
- 외운 티 안 나는 자연스러운 톤
- 면접관/합격생 시각의 인사이트 (뻔한 정보 X)
- 끝에 wonderfulcrew.com 링크
- 해시태그 4-6개 (#승무원 #외항사 등)
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
