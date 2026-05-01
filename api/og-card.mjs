// 카드뉴스 이미지 자동 생성 — @vercel/og edge runtime
// GET /api/og-card?title=...&subtitle=...&tag=...
// 1080x1080 정사각형 (인스타·Threads 친화)
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler(req) {
  try {
    const url = new URL(req.url);
    const title = url.searchParams.get('title') || '외항사 승무원 합격';
    const subtitle = url.searchParams.get('subtitle') || '7년차 에미레이트 출신 코치';
    const tag = url.searchParams.get('tag') || 'WONDERFULCREW INSIGHT';

    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '90px 80px',
            background: 'linear-gradient(135deg, #1A2340 0%, #2A3455 50%, #1A2340 100%)',
            color: '#fff',
            fontFamily: 'sans-serif',
          },
          children: [
            // 상단 - 태그
            {
              type: 'div',
              props: {
                style: { display: 'flex', alignItems: 'center', gap: '14px' },
                children: [
                  { type: 'div', props: { style: { width: '40px', height: '2px', background: '#E8C96A' } } },
                  { type: 'div', props: { style: { fontSize: '22px', color: '#E8C96A', letterSpacing: '0.3em', fontWeight: 700 }, children: tag } }
                ]
              }
            },
            // 중앙 - 제목
            {
              type: 'div',
              props: {
                style: { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' },
                children: [
                  { type: 'div', props: { style: { fontSize: '76px', fontWeight: 700, lineHeight: 1.25, marginBottom: '32px' }, children: title } },
                  { type: 'div', props: { style: { fontSize: '30px', color: '#E8C96A', fontWeight: 600 }, children: '— ' + subtitle } }
                ]
              }
            },
            // 하단 - 브랜드
            {
              type: 'div',
              props: {
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '40px', borderTop: '1px solid rgba(232,201,106,0.3)' },
                children: [
                  { type: 'div', props: { style: { display: 'flex', fontSize: '34px', fontWeight: 700, color: '#fff' }, children: [
                    { type: 'span', props: { children: 'Wonderful' } },
                    { type: 'span', props: { style: { color: '#E8C96A' }, children: 'Crew' } }
                  ] } },
                  { type: 'div', props: { style: { fontSize: '24px', color: 'rgba(232,201,106,0.85)' }, children: 'wonderfulcrew.com' } }
                ]
              }
            }
          ]
        }
      },
      { width: 1080, height: 1080 }
    );
  } catch (e) {
    return new Response('og-card error: ' + e.message, { status: 500 });
  }
}
