// Handles the "Account Link URL" step: after the user signs in to our own
// service, this matches the nonce Ring redirected them with against a
// pending unclaimed token, claims it for their account, and confirms +
// finalizes the integration with Ring.
import type { IncomingRequest, OutgoingResponse } from "../_http.ts";
import { kvDel, kvGet, kvSet, kvSmembers, kvSrem } from "../_kv.ts";
import { getSessionEmail } from "../_auth/session.ts";
import { computeNonce, isNonceTimeFresh, nonceMatches } from "../_auth/nonce.ts";
import type { RingLink } from "../_ringProxy.ts";

const APP_INTEGRATIONS_URL = "https://api.amazonvision.com/v1/accounts/me/app-integrations";
const UNCLAIMED_INDEX_KEY = "unclaimed_index";

interface UnclaimedToken {
  tokenId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  obtainedAt: number;
  ringAccountId: string;
  createdAt: number;
}

/** Ring's docs show masked identifiers like "u***r@partner.example.com". */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0] ?? "*"}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export default async function handler(req: IncomingRequest, res: OutgoingResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const cookieHeader = req.headers?.cookie;
  const email = getSessionEmail(typeof cookieHeader === "string" ? cookieHeader : undefined);
  if (!email) {
    res.status(401).json({ error: "Sign in before linking your Ring account" });
    return;
  }

  const hmacKey = process.env.RING_HMAC_SIGNING_KEY;
  if (!hmacKey) {
    res.status(500).json({ error: "RING_HMAC_SIGNING_KEY is not configured" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, string>;
  const { nonce, time } = body;
  if (!nonce || !time) {
    res.status(400).json({ error: "Missing nonce or time" });
    return;
  }
  if (!isNonceTimeFresh(time)) {
    res.status(400).json({ error: "This link request has expired. Try linking again from the Ring App." });
    return;
  }

  const tokenIds = await kvSmembers(UNCLAIMED_INDEX_KEY);
  let matched: UnclaimedToken | null = null;

  for (const tokenId of tokenIds) {
    const candidate = await kvGet<UnclaimedToken>(`unclaimed_token:${tokenId}`);
    if (!candidate) {
      await kvSrem(UNCLAIMED_INDEX_KEY, tokenId);
      continue;
    }
    const expected = computeNonce(time, candidate.ringAccountId, hmacKey);
    if (nonceMatches(expected, nonce)) {
      matched = candidate;
      break;
    }
  }

  if (!matched) {
    res.status(400).json({ error: "No matching pending Ring link found. Try linking again from the Ring App." });
    return;
  }

  const ringLink: RingLink = {
    accessToken: matched.accessToken,
    refreshToken: matched.refreshToken,
    expiresIn: matched.expiresIn,
    obtainedAt: matched.obtainedAt,
    ringAccountId: matched.ringAccountId,
  };
  await kvSet(`ring_link:${email}`, ringLink);
  await kvDel(`unclaimed_token:${matched.tokenId}`);
  await kvSrem(UNCLAIMED_INDEX_KEY, matched.tokenId);

  const accountIdentifier = maskEmail(email);
  const authHeaders = {
    "content-type": "application/json",
    authorization: `Bearer ${matched.accessToken}`,
  };

  try {
    const confirmRes = await fetch(APP_INTEGRATIONS_URL, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ account_identifier: accountIdentifier, nonce }),
    });
    if (!confirmRes.ok) {
      const detail = await confirmRes.json().catch(() => null);
      res.status(502).json({ error: "Ring rejected the account-link confirmation", detail });
      return;
    }

    const finalizeRes = await fetch(APP_INTEGRATIONS_URL, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ account_identifier: accountIdentifier, status: "completed" }),
    });
    if (!finalizeRes.ok) {
      const detail = await finalizeRes.json().catch(() => null);
      res.status(502).json({ error: "Linked, but failed to finalize the account link with Ring", detail });
      return;
    }
  } catch (err) {
    res.status(502).json({ error: "Failed to reach Ring while confirming the account link", detail: String(err) });
    return;
  }

  res.status(200).json({ status: "completed" });
}
