import { checkDomain, JSON_HEADERS } from "./check.js";
import { html } from "./ui.js";

async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

export async function handleRequest(request, env = {}) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (url.pathname === "/api/v1/check") {
    if (request.method !== "GET" && request.method !== "POST") {
      return Response.json({ ok: false, error: "Use GET or POST." }, { status: 405, headers: JSON_HEADERS });
    }
    const body = request.method === "POST" ? await readJson(request) : {};
    const result = await checkDomain(url.searchParams.get("domain") || body.domain, env);
    return Response.json(result, { status: result.ok ? 200 : 400, headers: JSON_HEADERS });
  }
  if (url.pathname === "/" || url.pathname === "/index.html") {
    return new Response(html(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  }
  return new Response("Not found", { status: 404 });
}

export default { fetch: (request, env) => handleRequest(request, env) };
