import { createServer } from "node:http";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { checkDomain } from "./check.js";
import { handleRequest } from "./worker.js";

const MAX_REDIRECTS = 5;

function checkWithNode({ domain, endpoint, timeoutMs, method, protocol }) {
  return requestOnce({ domain, hostname: endpoint, path: "/", timeoutMs, method, protocol, redirectsLeft: MAX_REDIRECTS });
}

function requestOnce({ domain, hostname, path, timeoutMs, method, protocol, redirectsLeft }) {
  return new Promise((resolve) => {
    const clientRequest = protocol === "https" ? httpsRequest : httpRequest;
    const options = {
      method,
      hostname,
      path,
      headers: { Host: domain },
      timeout: timeoutMs,
    };

    if (protocol === "https") {
      options.servername = hostname;
      options.rejectUnauthorized = false;
    }

    const req = clientRequest(options, (res) => {
      const location = res.headers.location;
      const shouldFollow = location && [301, 302, 303, 307, 308].includes(res.statusCode) && redirectsLeft > 0;
      res.resume();

      if (!shouldFollow) {
        resolve({ status: res.statusCode, error: null });
        return;
      }

      const nextUrl = new URL(location, `${protocol}://${hostname}${path}`);
      requestOnce({
        domain,
        hostname: nextUrl.hostname,
        path: `${nextUrl.pathname}${nextUrl.search}`,
        timeoutMs,
        method: res.statusCode === 303 ? "GET" : method,
        protocol: nextUrl.protocol.replace(":", ""),
        redirectsLeft: redirectsLeft - 1,
      }).then(resolve);
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ status: "ERR", error: "Timed out" });
    });

    req.on("error", () => resolve({ status: "ERR", error: "Request failed" }));
    req.end();
  });
}

async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

const port = Number(process.env.PORT || 8787);
const server = createServer(async (req, res) => {
  const origin = `http://${req.headers.host || `localhost:${port}`}`;
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", async () => {
    const request = new Request(new URL(req.url || "/", origin), { method: req.method, headers: req.headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
    const url = new URL(request.url);
    let response;
    if (url.pathname === "/api/v1/check") {
      if (request.method === "OPTIONS") {
        response = new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type" } });
      } else if (request.method !== "GET" && request.method !== "POST") {
        response = Response.json({ ok: false, error: "Use GET or POST." }, { status: 405, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" } });
      } else {
        const body = request.method === "POST" ? await readJson(request) : {};
        const result = await checkDomain(url.searchParams.get("domain") || body.domain, process.env, checkWithNode);
        response = Response.json(result, { status: result.ok ? 200 : 400, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" } });
      }
    } else {
      response = await handleRequest(request, process.env);
    }
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
});

server.listen(port, () => console.log(`is_blocked_in_china? is available at http://localhost:${port}`));
