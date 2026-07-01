export class AuthError extends Error {}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function signup(email: string, password: string): Promise<string> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new AuthError(typeof data.error === "string" ? data.error : "Sign up failed");
  return data.email as string;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new AuthError(typeof data.error === "string" ? data.error : "Sign in failed");
  return data.email as string;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function claimRingLink(nonce: string, time: string): Promise<void> {
  const res = await fetch("/api/ring/link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nonce, time }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new AuthError(typeof data.error === "string" ? data.error : "Failed to link your Ring account");
  }
}

export async function fetchCurrentSession(): Promise<string | null> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  const data = await parseJson(res);
  return (data.email as string) ?? null;
}
