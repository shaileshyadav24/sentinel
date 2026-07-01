// Vercel serverless function entry point. Thin adapter around the shared
// proxy logic in ../_ringProxy.ts - see that file for the rationale.
import type { IncomingRequest, OutgoingResponse } from "../_http.ts";
import { proxyRingApiRequest } from "../_ringProxy.ts";

export default async function handler(req: IncomingRequest, res: OutgoingResponse) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname.replace(/^\/api\/ring/, "") || "/";
  const cookieHeader = req.headers?.cookie;

  const result = await proxyRingApiRequest({
    method: req.method ?? "GET",
    path,
    search: url.search,
    cookieHeader: typeof cookieHeader === "string" ? cookieHeader : undefined,
    body: req.body,
  });

  res.status(result.status).json(result.body);
}
