# is_blocked_in_china?

A small API and web UI that checks whether a domain is likely blocked in China.

The check matches the reference probe: it sends an HTTP `GET` request to a Tencent Cloud COS endpoint and sets the tested domain as the `Host` header. The returned signal is interpreted using the rule set below.

## Result Rules

| Endpoint response | Result |
| --- | --- |
| `400` or `404` | Not likely blocked in China |
| `418` | Likely blocked in China |
| Request error or timeout | Likely blocked in China |
| Any other response | Needs another look |

Default probe:

```text
GET http://cos.ap-shenzhen-fsi.myqcloud.com/
Host: example.com
```

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

The page accepts a domain name and shows a plain-language result, the returned signal, and the check time.

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
  "endpoint": "cos.ap-shenzhen-fsi.myqcloud.com",
  "method": "GET",
  "protocol": "http",
  "checkedAt": "2026-07-02T12:00:00.000Z",
  "status": 418,
  "error": null,
  "result": "likely_blocked",
  "label": "Likely blocked in China",
  "summary": "The endpoint returned the blocked signal for this host."
}
```

Invalid input returns `400` with a short message:

```json
{
  "ok": false,
  "error": "Enter a full domain name.",
  "domain": "example",
  "endpoint": "cos.ap-shenzhen-fsi.myqcloud.com",
  "checkedAt": "2026-07-02T12:00:00.000Z"
}
```

## Configuration

| Name | Default | Purpose |
| --- | --- | --- |
| `ENDPOINT` | `cos.ap-shenzhen-fsi.myqcloud.com` | Tencent Cloud endpoint used for checks |
| `PROBE_METHOD` | `GET` | Request method sent to the endpoint |
| `PROBE_PROTOCOL` | `http` | Request protocol sent to the endpoint |
| `TIMEOUT_MS` | `6000` | Request timeout in milliseconds |
| `PORT` | `8787` | Local or Docker server port |

## Deploy to Cloudflare Workers

The Worker entry is `src/worker.js`, configured by `wrangler.toml`.

```powershell
npm install
npx wrangler deploy
```

To change the endpoint, timeout, method, or protocol, edit `wrangler.toml`:

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

Use a different endpoint or timeout:

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

This is a signal check, not a legal or network guarantee. Different Tencent Cloud regions can return different signals, so keep the endpoint configurable for comparison or future changes.
