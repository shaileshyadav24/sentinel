import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "ringboard_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface SessionPayload {
  email: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSessionCookie(email: string): string {
  const payload: SessionPayload = { email, exp: Date.now() + SESSION_TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const value = `${encoded}.${sign(encoded)}`;
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function parseSessionValue(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const cookie = part.trim();
    if (cookie.startsWith(`${COOKIE_NAME}=`)) {
      return cookie.slice(COOKIE_NAME.length + 1);
    }
  }
  return null;
}

/** Verifies a raw cookie value and returns the signed-in email, or null. */
export function verifySessionValue(value: string | null): string | null {
  if (!value) return null;
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const encoded = value.slice(0, dotIndex);
  const signature = value.slice(dotIndex + 1);

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload.email;
  } catch {
    return null;
  }
}

/** Extracts and verifies the session from a request's Cookie header, returning the signed-in email or null. */
export function getSessionEmail(cookieHeader: string | undefined): string | null {
  return verifySessionValue(parseSessionValue(cookieHeader));
}
