import type { IncomingRequest, OutgoingResponse } from "../_http.ts";
import { createSessionCookie } from "../_auth/session.ts";
import { createUser, getUser } from "../_auth/users.ts";

export default async function handler(req: IncomingRequest, res: OutgoingResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, string>;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  if (await getUser(email)) {
    res.status(409).json({ error: "An account with that email already exists" });
    return;
  }

  const user = await createUser(email, password);
  res.setHeader("set-cookie", createSessionCookie(user.email));
  res.status(200).json({ email: user.email });
}
