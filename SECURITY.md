# Security notes

## Secrets

- Configure **only** via environment variables or your platform’s secret store. Do not commit `.env` files that contain real API keys.
- `SENTINEL_API_KEYS` holds long random values. Anyone with a key can use the API when `SENTINEL_REQUIRE_API_KEY=1`.

## Client IP and reverse proxies

- By default, **`X-Forwarded-For` is not trusted** (spoofing would otherwise fake consent IPs). Only the direct peer address is used.
- Set **`SENTINEL_TRUSTED_PROXY_IPS`** to the IPs or CIDRs of your nginx, Traefik, Cloudflare tunnel, etc. When a request’s immediate peer matches, the **first** `X-Forwarded-For` hop is used as the client IP for consent logging and rate limiting.

## CORS

- Set **`SENTINEL_CORS_ORIGINS`** to an explicit comma-separated list in production. The default allows local development and the Docker Compose UI host.

## Browser `EventSource` and API keys

- Browsers cannot attach custom headers to `EventSource`. When API keys are required, the UI passes **`api_key` as a query parameter** on `/api/scans/{id}/events` only. Prefer same-origin deployment and HTTPS so this does not leak in `Referer` logs.

## Logging and findings

- Scan failures are recorded as **`failed:<ExceptionClassName>`** without embedding full exception text (which could echo probe payloads).
- Avoid turning on verbose HTTP client logging in production if responses might contain reflected content.

## Rate limits

- SlowAPI applies per **API key** (hashed) when a key is sent, otherwise per **client IP** (after trusted-proxy handling).

## Uvicorn behind a reverse proxy

- Run Uvicorn with **`--proxy-headers`** (and bind only to internal interfaces) so `request.client.host` reflects the proxy, then list those proxy IPs in **`SENTINEL_TRUSTED_PROXY_IPS`** so `X-Forwarded-For` is honored for real clients.
