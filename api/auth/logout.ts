import type { IncomingRequest, OutgoingResponse } from "../_http.ts";
import { clearSessionCookie } from "../_auth/session.ts";

export default async function handler(req: IncomingRequest, res: OutgoingResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.setHeader("set-cookie", clearSessionCookie());
  res.status(200).json({ ok: true });
}
