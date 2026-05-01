// 카드뉴스 이미지 자동 생성 — @vercel/og edge runtime
// 승무원 이미지 배경 + 어두운 그라데이션 오버레이 + 골드 강조 인스타 스타일
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const PERSONA_BG = {
  coach:   'https://wonderfulcrew.com/images/ceo-profile.jpg',
  mentor:  'https://wonderfulcrew.com/images/coach-lecture.png',
  success: 'https://wonderfulcrew.com/images/advisor-emirates.jpg',
  data:    'https://wonderfulcrew.com/images/advisor-cathay.jpg',
};

const PERSONA_LABEL = {
  coach:   '7년차 일등석 출신 코치',
  mentor:  '13년 경력 면접 멘토',
  success: '합격생 후기',
  data:    '데이터 인사이트',
};

export default function handler(req) {
  try {
    const url = new URL(req.url);
    const title = url.searchParams.get('title') || '외항사 승무원 합격 가이드';
    const personaKey = url.searchParams.get('persona') || 'coach';
    const subtitle = url.searchParams.get('subtitle') || PERSONA_LABEL[personaKey] || '원더풀크루';
    const tag = url.searchParams.get('tag') || 'WONDERFULCREW';
    const bgUrl = PERSONA_BG[personaKey] || PERSONA_BG.coach;

    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            position: 'relative',
            width: '100%',
            height: '100%',
            fontFamily: 'sans-serif',
          },
          children: [
            // 배경 승무원 이미지
            {
              type: 'img',
              props: {
                src: bgUrl,
                style: {
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 25%',
                }
              }
            },
            // 다중 그라데이션 오버레이 (좌측 짙음, 우측 살짝 밝음, 하단 짙음)
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  background: 'linear-gradient(180deg, rgba(17,27,46,0.55) 0%, rgba(17,27,46,0.35) 35%, rgba(17,27,46,0.85) 75%, rgba(17,27,46,0.97) 100%)',
                  display: 'flex',
                }
              }
            },
            // 좌측 사이드 골드 라인 (장식)
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: '70px',
                  left: '70px',
                  width: '4px',
                  height: '120px',
                  background: '#E8C96A',
                }
              }
            },
            // 텍스트 영역 (하단 정렬)
            {
              type: 'div',
              props: {
                style: {
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  width: '100%',
                  padding: '70px 80px 70px 100px',
                  color: '#fff',
                },
                children: [
                  // 상단 - 작은 태그
                  {
                    type: 'div',
                    props: {
                      style: {
                        position: 'absolute',
                        top: '70px',
                        left: '100px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '18px',
                              color: '#E8C96A',
                              letterSpacing: '0.35em',
                              fontWeight: 700,
                            },
                            children: tag
                          }
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '14px',
                              color: 'rgba(255,255,255,0.55)',
                              letterSpacing: '0.2em',
                            },
                            children: 'CABIN CREW INTERVIEW'
                          }
                        }
                      ]
                    }
                  },
                  // 메인 제목
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: title.length > 25 ? '62px' : '78px',
                        fontWeight: 700,
                        lineHeight: 1.2,
                        letterSpacing: '-0.02em',
                        marginBottom: '28px',
                        textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                      },
                      children: title
                    }
                  },
                  // 부제목 + 골드 라인
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        marginBottom: '54px',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { width: '32px', height: '2px', background: '#E8C96A' }
                          }
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '24px',
                              color: '#E8C96A',
                              fontWeight: 600,
                            },
                            children: subtitle
                          }
                        }
                      ]
                    }
                  },
                  // 하단 - 브랜드
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        paddingTop: '24px',
                        borderTop: '1px solid rgba(232,201,106,0.35)',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', flexDirection: 'column' },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', fontSize: '32px', fontWeight: 700, fontFamily: 'serif', letterSpacing: '0.02em' },
                                  children: [
                                    { type: 'span', props: { children: 'Wonderful' } },
                                    { type: 'span', props: { style: { color: '#E8C96A' }, children: 'Crew' } }
                                  ]
                                }
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { fontSize: '14px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.15em', marginTop: '4px' },
                                  children: 'PREMIUM CABIN CREW COACHING'
                                }
                              }
                            ]
                          }
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '20px',
                              color: 'rgba(232,201,106,0.95)',
                              letterSpacing: '0.05em',
                              padding: '8px 16px',
                              border: '1px solid rgba(232,201,106,0.5)',
                              borderRadius: '20px',
                            },
                            children: 'wonderfulcrew.com'
                          }
                        }
                      ]
                    }
                  }
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
