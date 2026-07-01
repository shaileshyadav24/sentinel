import type { IncomingRequest, OutgoingResponse } from "../_http.ts";
import { createSessionCookie } from "../_auth/session.ts";
import { getUser, verifyUserPassword } from "../_auth/users.ts";

export default async function handler(req: IncomingRequest, res: OutgoingResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, string>;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = await getUser(email);
  if (!user || !(await verifyUserPassword(user, password))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  res.setHeader("set-cookie", createSessionCookie(user.email));
  res.status(200).json({ email: user.email });
}
