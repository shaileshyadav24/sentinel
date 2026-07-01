import { createHmac, timingSafeEqual } from "node:crypto";

const VALIDATION_WINDOW_MS = 600 * 1000;

/** nonce = base64url_nopad(HMAC-SHA256(hmacKey, "{time}:{accountId}")) */
export function computeNonce(time: string | number, accountId: string | number, hmacKey: string): string {
  return createHmac("sha256", hmacKey).update(`${time}:${accountId}`).digest("base64url");
}

export function isNonceTimeFresh(time: string | number, now = Date.now()): boolean {
  const timestamp = Number(time);
  return Number.isFinite(timestamp) && Math.abs(now - timestamp) <= VALIDATION_WINDOW_MS;
}

export function nonceMatches(candidate: string, received: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}
