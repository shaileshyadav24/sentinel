// Shared proxy logic for forwarding browser API calls to Ring's partner
// API. Exists to work around CORS (api.amazonvision.com isn't reachable
// from a browser origin) AND to keep the real Ring access token out of the
// browser entirely: the token lives in `ring_link:{email}`, keyed by the
// signed-in partner session, and is attached here server-side.

import { kvGet, kvSet } from "./_kv.js";
import { getSessionEmail } from "./_auth/session.js";

const RING_API_BASE_URL = "https://api.amazonvision.com";
const RING_TOKEN_URL = "https://oauth.ring.com/oauth/token";

export interface RingLink {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  obtainedAt: number;
  ringAccountId: string;
}

export interface ProxyResult {
  status: number;
  body: unknown;
}

function ringLinkKey(email: string): string {
  return `ring_link:${email}`;
}

function isExpired(link: RingLink, marginMs = 60_000): boolean {
  return Date.now() >= link.obtainedAt + link.expiresIn * 1000 - marginMs;
}

async function refreshRingLink(email: string, link: RingLink): Promise<RingLink | null> {
  const clientId = process.env.RING_CLIENT_ID;
  const clientSecret = process.env.RING_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: link.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  let res: Response;
  try {
    res = await fetch(RING_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data?.access_token) return null;

  const refreshed: RingLink = {
    accessToken: data.access_token as string,
    refreshToken: typeof data.refresh_token === "string" ? data.refresh_token : link.refreshToken,
    expiresIn: (data.expires_in as number) ?? link.expiresIn,
    obtainedAt: Date.now(),
    ringAccountId: link.ringAccountId,
  };
  await kvSet(ringLinkKey(email), refreshed);
  return refreshed;
}

export async function proxyRingApiRequest(params: {
  method: string;
  path: string;
  search: string;
  cookieHeader: string | undefined;
  body?: unknown;
}): Promise<ProxyResult> {
  const email = getSessionEmail(params.cookieHeader);
  if (!email) {
    return { status: 401, body: { error: "Not signed in" } };
  }

  let link = await kvGet<RingLink>(ringLinkKey(email));
  if (!link) {
    return { status: 409, body: { error: "Ring account not linked yet" } };
  }

  if (isExpired(link)) {
    const refreshed = await refreshRingLink(email, link);
    if (!refreshed) {
      // Not a 401: the browser is correctly signed in to RingBoard, only the
      // Ring link itself is broken. A 401 here would make the frontend's
      // "not signed in" handler hard-redirect to "/", which immediately
      // bounces an authenticated user back to /dashboard - an infinite
      // reload loop, not a fix.
      return { status: 409, body: { error: "Ring session expired, please relink your account" } };
    }
    link = refreshed;
  }

  const targetUrl = `${RING_API_BASE_URL}${params.path}${params.search}`;
  const hasBody = !["GET", "HEAD"].includes(params.method) && params.body !== undefined;

  const doFetch = (accessToken: string) =>
    fetch(targetUrl, {
      method: params.method,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: hasBody ? JSON.stringify(params.body) : undefined,
    });

  try {
    let upstream = await doFetch(link.accessToken);

    if (upstream.status === 401) {
      const refreshed = await refreshRingLink(email, link);
      if (refreshed) {
        upstream = await doFetch(refreshed.accessToken);
      } else {
        // Same reasoning as above: a broken Ring link must never surface as
        // a bare 401 to the browser, or ringClient's 401 handler loops.
        return { status: 409, body: { error: "Ring session expired, please relink your account" } };
      }
    }

    const data = await upstream.json().catch(() => null);
    return { status: upstream.status, body: data };
  } catch (err) {
    return { status: 502, body: { error: "Failed to reach Ring API", detail: String(err) } };
  }
}
