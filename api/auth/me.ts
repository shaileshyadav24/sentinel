import type { IncomingRequest, OutgoingResponse } from "../_http.js";
import { getSessionEmail } from "../_auth/session.js";

export default async function handler(req: IncomingRequest, res: OutgoingResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const cookieHeader = req.headers?.cookie;
  const email = getSessionEmail(typeof cookieHeader === "string" ? cookieHeader : undefined);

  if (!email) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  res.status(200).json({ email });
}
