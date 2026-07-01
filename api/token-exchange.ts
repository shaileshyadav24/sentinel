// This IS the "Token Exchange URL" registered in the Ring Developer
// Portal: Ring's backend calls this directly, server-to-server, with an
// authorization code - before any user has ever signed into our service.
// We exchange the code with Ring's OAuth server and hold the resulting
// token pair as an "unclaimed" token until a user later claims it via the
// nonce flow in api/ring/link.ts. Ring's exact request shape to this URL
// isn't documented, so `code` is parsed defensively from a few plausible
// shapes (JSON body, form-urlencoded body, or query string).

import { randomUUID } from "node:crypto";
import type { IncomingRequest, OutgoingResponse } from "./_http.js";
import { kvSadd, kvSet } from "./_kv.js";

const RING_TOKEN_URL = "https://oauth.ring.com/oauth/token";
const USERS_ME_URL = "https://api.amazonvision.com/v1/users/me";
const UNCLAIMED_INDEX_KEY = "unclaimed_index";
const UNCLAIMED_TTL_SECONDS = 30 * 60;

function extractCode(req: IncomingRequest): string | null {
  const body = req.body;
  if (body && typeof body === "object" && "code" in body) {
    const value = (body as Record<string, unknown>).code;
    if (typeof value === "string" && value) return value;
  }
  if (typeof body === "string" && body) {
    const params = new URLSearchParams(body);
    const value = params.get("code");
    if (value) return value;
  }
  const url = new URL(req.url ?? "/", "http://localhost");
  return url.searchParams.get("code");
}

/** Docs only say this endpoint returns "the authenticated user's Account ID" without pinning down the exact response shape, so this checks a few plausible spots. */
function extractAccountId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (typeof record.account_id === "string") return record.account_id;
  if (record.data && typeof record.data === "object") {
    const resource = record.data as Record<string, unknown>;
    if (typeof resource.id === "string") return resource.id;
    const attrs = resource.attributes as Record<string, unknown> | undefined;
    if (attrs && typeof attrs.account_id === "string") return attrs.account_id;
  }
  if (typeof record.id === "string") return record.id;
  return null;
}

export default async function handler(req: IncomingRequest, res: OutgoingResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const clientId = process.env.RING_CLIENT_ID;
  const clientSecret = process.env.RING_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).json({ error: "Missing RING_CLIENT_ID or RING_CLIENT_SECRET configuration" });
    return;
  }

  const code = extractCode(req);
  if (!code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
  });

  let tokenData: Record<string, unknown>;
  try {
    const upstream = await fetch(RING_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });
    tokenData = (await upstream.json()) as Record<string, unknown>;
    if (!upstream.ok) {
      res.status(upstream.status).json(tokenData);
      return;
    }
  } catch (err) {
    res.status(502).json({ error: "Failed to reach Ring's token endpoint", detail: String(err) });
    return;
  }

  const accessToken = tokenData.access_token as string | undefined;
  const refreshToken = tokenData.refresh_token as string | undefined;
  const expiresIn = tokenData.expires_in as number | undefined;
  if (!accessToken || !refreshToken || !expiresIn) {
    res.status(502).json({ error: "Ring's token response was missing expected fields" });
    return;
  }

  let ringAccountId: string | null = null;
  try {
    const profileRes = await fetch(USERS_ME_URL, { headers: { authorization: `Bearer ${accessToken}` } });
    if (profileRes.ok) {
      ringAccountId = extractAccountId(await profileRes.json());
    }
  } catch {
    // ringAccountId stays null, handled below
  }

  if (!ringAccountId) {
    res.status(502).json({ error: "Could not resolve the Ring Account ID for this token" });
    return;
  }

  const tokenId = randomUUID();
  await kvSet(
    `unclaimed_token:${tokenId}`,
    {
      tokenId,
      accessToken,
      refreshToken,
      expiresIn,
      obtainedAt: Date.now(),
      ringAccountId,
      createdAt: Date.now(),
    },
    UNCLAIMED_TTL_SECONDS,
  );
  await kvSadd(UNCLAIMED_INDEX_KEY, tokenId);

  res.status(200).json({ ok: true });
}
