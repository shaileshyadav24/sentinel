# RingBoard

A read-only monitoring dashboard for Ring devices. React + Vite + TypeScript
frontend, several Vercel serverless functions for the Ring partner
integration and RingBoard's own accounts, Upstash Redis (or Vercel KV) for
persistence.

> **Note on the Ring API used here:** this is a genuine Ring Partner API
> integration (`https://api.amazonvision.com` + `https://oauth.ring.com`),
> documented at developer.amazon.com/docs/ring/api-documentation.html. It
> requires a real registered partner app (Client ID, Client Secret, HMAC
> Signing Key from developer.amazon.com/ring/console/apps) and — until that
> app is listed/approved in the Ring AppStore — the linking flow below
> cannot be triggered by a real user; the pieces that don't depend on the
> listing (RingBoard's own accounts, the nonce-matching logic) can still be
> built and tested locally.

## How linking works

RingBoard uses Ring's one-way account-linking model — Ring holds the OAuth
credential lifecycle, RingBoard verifies an HMAC-signed nonce:

1. A user finds RingBoard in the **Ring App** and clicks "Confirm" — this
   happens entirely inside Ring's app, not on RingBoard.
2. Ring's backend calls RingBoard's registered **Token Exchange URL**
   (`api/token-exchange.ts`) server-to-server with an authorization code.
   RingBoard exchanges it at `oauth.ring.com/oauth/token` and stores the
   result as an "unclaimed" token in Redis — there's no signed-in RingBoard
   user yet at this point.
3. Ring redirects the user's browser to RingBoard's registered
   **Account Link URL** (`/ring/link?nonce=...&time=...`), where they sign in
   or create a RingBoard account.
4. After sign-in, `api/ring/link.ts` fetches `GET /v1/users/me` for each
   unclaimed token to get its Ring Account ID, recomputes the nonce
   (`HMAC-SHA256(hmac_key, "{time}:{account_id}")`, base64url, no padding)
   for each, and matches it against the one Ring sent — constant-time
   compare, rejecting anything outside a 600-second window.
5. On a match, the token is claimed for that RingBoard user, and RingBoard
   calls `POST` then `PATCH https://api.amazonvision.com/v1/accounts/me/app-integrations`
   to confirm and finalize the link with Ring.

Ring also delivers device-event webhooks (`api/ring/webhook.ts`), signed
with the same HMAC key but **hex**-encoded (`X-Signature: sha256=<hex>`) —
distinct from the nonce's base64url encoding. Currently verified and
acknowledged only; not yet persisted or shown in the UI.

## 1. Prerequisites

- A real Ring Partner app registered at developer.amazon.com/ring/console/apps
  (Client ID, Client Secret, HMAC Signing Key)
- An Upstash Redis or Vercel KV instance (Vercel dashboard → Storage →
  Create Database → KV)
- Copy `.env.example` to `.env` and fill in `RING_CLIENT_ID`,
  `RING_CLIENT_SECRET`, `RING_HMAC_SIGNING_KEY`, `SESSION_SECRET` (any
  random value), `KV_REST_API_URL`, `KV_REST_API_TOKEN`

## 2. Run locally

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. All of `/api/*` (auth, the Ring
proxy, the token-exchange receiver, the account-link claim endpoint, the
webhook) is served in-process by a Vite dev-middleware plugin in
`vite.config.ts`, so `npm run dev` alone is enough — no separate `vercel dev`
needed.

Until the Ring AppStore listing is approved, steps 1–2 above can't be
triggered by a real Ring user. What *can* be exercised locally:
RingBoard's own signup/login (`/`), and the nonce-matching + claim flow
(`api/ring/link.ts`) by manually inserting a fake `unclaimed_token:{id}`
record into Redis with a known `ringAccountId`, computing the matching
nonce with the real HMAC key, and visiting `/ring/link?nonce=...&time=...`.

## 3. Deploy to Vercel

```bash
vercel --prod
```

Set the environment variables from `.env.example` in the Vercel project
settings. Once deployed, register the real URLs in the Ring Developer
Portal: Token Exchange URL → `/api/token-exchange`, Account Link URL →
`/ring/link`, Webhook URL → `/api/ring/webhook`.

## Architecture notes

- The browser never holds a Ring access token. `src/api/ringClient.ts` calls
  `/api/ring/*` with `withCredentials: true`; `api/_ringProxy.ts` resolves
  the actual Ring token server-side from the signed-in session →
  `ring_link:{email}` record, refreshing it on expiry or a `401` before the
  browser ever sees one.
- RingBoard's own accounts (separate from Ring's) live in
  `api/auth/*.ts` + `api/_auth/`: scrypt password hashing, a stateless
  HMAC-signed session cookie — no session table.
- `api/_kv.ts` is a minimal Upstash REST client (plain `fetch`, no Redis
  wire-protocol dependency) used for partner accounts, unclaimed tokens, and
  active Ring links.
- No camera/video streaming, device control, or alarm arming is implemented
  — this is a read-only monitoring surface only.
# sentinel
