// Cloudflare Workers 진입점 (advanced mode) — 정적 자산은 ASSETS로, /api/* 는 기존 Vercel 핸들러를 어댑터로 실행.
// 함수는 동적 import(지연 로딩)로 격리 — 한 함수가 실패해도 다른 라우트/정적 사이트에 영향 없음.
// 함수 추가는 ROUTES 에 한 줄씩만 등록.

const ROUTES = {
  "/api/image-check": () => import("./api/image-check.js"),
  "/api/photo-finish": () => import("./api/photo-finish.js"),
  "/api/ai": () => import("./api/ai.js"),
  "/api/tts": () => import("./api/tts.js"),
  "/api/stt": () => import("./api/stt.js"),
  "/api/news": () => import("./api/news.js"),
  "/api/search": () => import("./api/search.js"),
  "/api/seminar-signup": () => import("./api/seminar-signup.js"),
  "/api/partner-inquiry": () => import("./api/partner-inquiry.js"),
  "/api/save-profile": () => import("./api/save-profile.js"),
  "/api/track-visit": () => import("./api/track-visit.js"),
  "/api/supabase-config": () => import("./api/supabase-config.js"),
  "/api/vapid-public": () => import("./api/vapid-public.js"),
  "/api/push-subscribe": () => import("./api/push-subscribe.js"),
  "/api/push-send": () => import("./api/push-send.js"),
  "/api/paypal-config": () => import("./api/paypal-config.js"),
  "/api/paypal-create-order": () => import("./api/paypal-create-order.js"),
  "/api/paypal-capture-order": () => import("./api/paypal-capture-order.js"),
  "/api/paypal-create-subscription": () => import("./api/paypal-create-subscription.js"),
  "/api/paypal-subscription-record": () => import("./api/paypal-subscription-record.js"),
  "/api/paypal-webhook": () => import("./api/paypal-webhook.js"),
  "/api/paypal-setup-plans": () => import("./api/paypal-setup-plans.js"),
  "/api/paypal-setup-webhook": () => import("./api/paypal-setup-webhook.js"),
  "/api/paypal-subtest": () => import("./api/paypal-subtest.js"),
  // 국내카드결제 (이니페이)
  "/api/innopay-prepare": () => import("./api/innopay-prepare.js"),
  "/api/innopay-confirm": () => import("./api/innopay-confirm.js"),
  "/api/innopay-webhook": () => import("./api/innopay-webhook.js"),
  // 구독 취소·환불·결제 기록
  "/api/cancel-subscription": () => import("./api/cancel-subscription.js"),
  "/api/request-refund": () => import("./api/request-refund.js"),
  "/api/save-payment": () => import("./api/save-payment.js"),
  "/api/request-deposit": () => import("./api/request-deposit.js"),
  "/api/approve-deposit": () => import("./api/approve-deposit.js"),
  "/api/backfill-payment": () => import("./api/backfill-payment.js"),
  "/api/heal-plan-active": () => import("./api/heal-plan-active.js"),
  // 스트라이프(영어 결제)
  "/api/create-checkout": () => import("./api/create-checkout.js"),
  "/api/create-subscription": () => import("./api/create-subscription.js"),
  // 관리자 도구
  "/api/admin-data": () => import("./api/admin-data.js"),
  "/api/admin-force-activate": () => import("./api/admin-force-activate.js"),
  "/api/env-check": () => import("./api/env-check.js"),
  // 알림톡/SMS/AI 화상
  "/api/solapi-send": () => import("./api/solapi-send.js"),
  "/api/did-lipsync": () => import("./api/did-lipsync.js"),
  // 성장 분석
  "/api/analyze-growth": () => import("./api/analyze-growth.js"),
  // 마케팅·SNS 자동화 (cron 트리거로 호출됨 — 아래 [triggers] 참고)
  "/api/reconcile-subscriptions": () => import("./api/reconcile-subscriptions.js"),
  "/api/generate-sns-content": () => import("./api/generate-sns-content.js"),
  "/api/sns-publish": () => import("./api/sns-publish.js"),
  "/api/sns-queue-list": () => import("./api/sns-queue-list.js"),
  "/api/marketing-push-cron": () => import("./api/marketing-push-cron.js"),
  "/api/seo-ping": () => import("./api/seo-ping.js"),
  "/api/email-campaign-cron": () => import("./api/email-campaign-cron.js"),
  // 무료 라이브 완주자 전자책
  "/api/ebook-unlock": () => import("./api/ebook-unlock.js"),
  "/api/ebook-admin": () => import("./api/ebook-admin.js"),
};

// Cloudflare Cron Triggers (scheduled 핸들러) — 버셀 vercel.json 의 crons 를 그대로 옮긴 것.
// wrangler.toml 의 [triggers] crons 와 짝을 이룸. 대시보드에서 Git 연결로만 배포하면
// 이 scheduled() 가 안 걸릴 수 있으니, 배포 후 반드시 Cloudflare 대시보드 > Workers & Pages >
// 해당 프로젝트 > Settings > Trigger Events 에 Cron Trigger 가 등록됐는지 확인할 것.
const CRON_ROUTES = {
  "0 * * * *": "/api/reconcile-subscriptions",
  "0 4 * * *": "/api/generate-sns-content?count=10",
  "0 */2 * * *": "/api/sns-publish",
  "0 10 * * *": "/api/marketing-push-cron",
  "0 5 * * *": "/api/seo-ping",
  "0 9 * * *": "/api/email-campaign-cron",
};

function json(obj, status) { return new Response(JSON.stringify(obj), { status: status || 200, headers: { "content-type": "application/json" } }); }

// Vercel 스타일 (req,res) 핸들러를 Cloudflare fetch 로 어댑팅
async function runVercel(handler, request, env) {
  try {
    if (typeof process === "undefined") globalThis.process = { env: {} };
    if (!process.env) process.env = {};
    for (const k in env) { if (typeof env[k] === "string") process.env[k] = env[k]; }
  } catch (e) {}

  const bodyText = request.method === "GET" || request.method === "HEAD" ? "" : await request.text();
  const urlObj = new URL(request.url);
  const req = {
    method: request.method,
    url: urlObj.pathname + urlObj.search,
    query: Object.fromEntries(urlObj.searchParams),
    headers: Object.fromEntries(request.headers),
    body: bodyText,
  };

  return await new Promise((resolve) => {
    const headers = new Headers();
    let statusCode = 200;
    const finish = (payload) => resolve(new Response(payload, { status: statusCode, headers }));
    const res = {
      setHeader: (k, v) => headers.set(k, String(v)),
      status: (c) => { statusCode = c; return res; },
      json: (o) => { if (!headers.has("content-type")) headers.set("content-type", "application/json"); finish(JSON.stringify(o)); return res; },
      send: (s) => { finish(typeof s === "string" ? s : JSON.stringify(s)); return res; },
      end: (s) => { finish(s || ""); return res; },
    };
    Promise.resolve(handler(req, res)).catch((e) => {
      statusCode = 500; headers.set("content-type", "application/json");
      finish(JSON.stringify({ error: String((e && e.message) || e) }));
    });
  });
}

export default {
  // Cloudflare Cron Trigger 진입점 — event.cron 문자열로 CRON_ROUTES 에서 대상 경로를 찾아
  // 내부적으로 그 API 를 x-cron-secret 인증 헤더와 함께 호출한다.
  // (wrangler.toml 의 [triggers] crons 와 CRON_ROUTES 키가 정확히 같은 문자열이어야 매칭됨)
  async scheduled(event, env, ctx) {
    const path = CRON_ROUTES[event.cron];
    if (!path) { console.error("[cron] unknown schedule:", event.cron); return; }
    const base = env.SITE_ORIGIN || "https://wonderfulcrew.com";
    const request = new Request(base + path, {
      method: "GET",
      headers: { "x-cron-secret": env.CRON_SECRET || "" },
    });
    ctx.waitUntil(this.fetch(request, env, ctx));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/_cfhealth") {
      return json({ ok: true, runtime: "cloudflare-workers", routes: Object.keys(ROUTES).length, hasAnthropic: !!env.ANTHROPIC_API_KEY, hasGemini: !!env.GEMINI_API_KEY });
    }
    const loader = ROUTES[url.pathname];
    if (loader) {
      let handler;
      try {
        const mod = await loader();
        handler = mod && (mod.default || mod);
      } catch (e) {
        return json({ error: "function load failed", detail: String((e && e.message) || e) }, 500);
      }
      if (typeof handler !== "function") return json({ error: "handler not a function" }, 500);
      return runVercel(handler, request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
