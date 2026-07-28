// Cloudflare Workers 진입점 (advanced mode) — 정적 자산은 ASSETS로, /api/* 는 기존 Vercel 핸들러를 어댑터로 실행.
// 기존 api/*.js (module.exports = (req,res)=>{}) 를 그대로 재사용 → 중복/IP 드리프트 없음.
// 함수 추가는 아래 ROUTES 에 한 줄씩만 등록하면 됨.

import imageCheck from "./api/image-check.js";
import photoFinish from "./api/photo-finish.js";

const ROUTES = {
  "/api/image-check": imageCheck,
  "/api/photo-finish": photoFinish,
};

// Vercel 스타일 (req,res) 핸들러를 Cloudflare fetch 로 어댑팅
async function runVercel(handler, request, env) {
  // 시크릿/환경변수를 process.env 로 노출(핸들러가 process.env.X 로 읽음)
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
      return new Response(JSON.stringify({ ok: true, runtime: "cloudflare-workers", hasAnthropic: !!env.ANTHROPIC_API_KEY, hasGemini: !!env.GEMINI_API_KEY }), { headers: { "content-type": "application/json" } });
    }
    const handler = ROUTES[url.pathname];
    if (handler) return runVercel(handler, request, env);
    // 그 외는 정적 자산
    return env.ASSETS.fetch(request);
  },
};
