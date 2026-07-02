# Blocked in China?

A small API and web UI that checks whether a domain is likely blocked in China.

The public API returns only the tested domain, check time, response signal, and the final result. The underlying check settings stay server-side.

## Result Rules

| Signal | API result |
| --- | --- |
| `400` or `404` | `not_blocked` |
| `418` | `blocked` |
| Request error or timeout | `blocked` |
| Any other signal | `blocked` |

## Web UI

Run the app and open the home page:

```powershell
npm install
npm run dev
```

Then visit:

```text
http://localhost:8787
```

The page accepts a domain name, includes preset domains for quick testing, shows API usage, and displays the raw response from the same request used for the visible result.

## API v1

### Check a domain

```http
GET /api/v1/check?domain=github.com
```

You can also send JSON:

```http
POST /api/v1/check
content-type: application/json

{ "domain": "github.com" }
```

Example response:

```json
{
  "ok": true,
  "domain": "github.com",
  "checkedAt": "2026-07-02T12:00:00.000Z",
  "status": 418,
  "error": null,
  "result": "blocked",
  "label": "blocked",
  "summary": "This domain is likely blocked in China."
}
```

Invalid input returns `400` with a short message:

```json
{
  "ok": false,
  "error": "Enter a full domain name.",
  "domain": "example",
  "checkedAt": "2026-07-02T12:00:00.000Z"
}
```

## Configuration

| Name | Default | Purpose |
| --- | --- | --- |
| `ENDPOINT` | `cos.ap-shenzhen-fsi.myqcloud.com` | Server-side check target |
| `PROBE_METHOD` | `GET` | Server-side request method |
| `PROBE_PROTOCOL` | `http` | Server-side request protocol |
| `TIMEOUT_MS` | `6000` | Request timeout in milliseconds |
| `PORT` | `8787` | Local or Docker server port |

## Deploy to Cloudflare Workers

The Worker entry is `src/worker.js`, configured by `wrangler.toml`.

```powershell
npm install
npx wrangler deploy
```

To change the server-side check settings, edit `wrangler.toml`:

```toml
[vars]
ENDPOINT = "cos.ap-shenzhen-fsi.myqcloud.com"
TIMEOUT_MS = "6000"
PROBE_METHOD = "GET"
PROBE_PROTOCOL = "http"
```

You can verify the Worker bundle without publishing:

```powershell
npx wrangler deploy --dry-run
```

## Deploy with Docker

```powershell
docker build -t is-blocked-in-china .
docker run --rm -p 8787:8787 is-blocked-in-china
```

Use different server-side check settings if needed:

```powershell
docker run --rm -p 8787:8787 -e ENDPOINT=cos.ap-shenzhen-fsi.myqcloud.com -e TIMEOUT_MS=6000 is-blocked-in-china
```

## Project Layout

```text
src/check.js    Shared domain validation and result mapping
src/worker.js   Cloudflare Worker entry
src/server.js   Local and Docker server
src/ui.js       Web UI HTML, CSS, and browser behavior
```

## Verification

```powershell
npm run build
npx wrangler deploy --dry-run
```

A local API check should look like this:

```powershell
Invoke-RestMethod -Uri 'http://localhost:8787/api/v1/check?domain=baidu.com' -Method Get
```

## Notes

This is a signal check, not a legal or network guarantee. Different server-side targets can return different signals, so keep the check settings configurable for comparison or future changes.
