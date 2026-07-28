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
  const req = {
    method: request.method,
    url: new URL(request.url).pathname,
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
