// Vercel serverless function entry point. Thin adapter around the shared,
// stateless proxy logic in ../_ringProxyHandler.js - see that file for the
// rationale (CORS workaround only, no persistence).
import { proxyRingRequest, CORS_HEADERS } from "../_ringProxyHandler.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const url = new URL(req.url, "http://localhost");
  // req.url for a Vercel catch-all is like /api/ring/oauth/token?x=1
  const segments = url.pathname.replace(/^\/api\/ring\//, "").split("/").filter(Boolean);

  const body = await readRawBody(req);

  const result = await proxyRingRequest({
    segments,
    query: url.searchParams.toString(),
    method: req.method,
    headers: req.headers,
    body,
  });

  res.writeHead(result.status, { ...result.headers, ...CORS_HEADERS });
  res.end(result.body);
}
