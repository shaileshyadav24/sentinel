// Device-event webhook receiver ("Webhook URL" in the Ring Developer
// Portal). Ring signs the raw request body with HMAC-SHA256 (hex digest,
// "sha256=" prefix) using the same HMAC key issued during partner
// onboarding - note this is HEX encoding, distinct from the base64url
// encoding used for the account-link nonce in ../_auth/nonce.ts.
//
// Verifying the signature needs the exact raw bytes Ring sent, so this
// reads the request body itself (Vercel's automatic JSON body parsing is
// disabled below) rather than relying on a pre-parsed `body`.
//
// Minimal this pass: verify, ack fast, log. No persistence or dashboard
// UI for push-delivered events yet - the dashboard already polls
// /v1/history/devices/{id}/events.

import { createHmac, timingSafeEqual } from "node:crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface StreamingIncomingRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface OutgoingResponse {
  status: (code: number) => OutgoingResponse;
  json: (body: unknown) => void;
}

async function readRawBody(req: AsyncIterable<Buffer>): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

function verifySignature(rawBody: string, signatureHeader: string | undefined, hmacKey: string): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const received = signatureHeader.slice("sha256=".length);
  const expected = createHmac("sha256", hmacKey).update(rawBody).digest("hex");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
}

export default async function handler(
  req: StreamingIncomingRequest & AsyncIterable<Buffer>,
  res: OutgoingResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const hmacKey = process.env.RING_HMAC_SIGNING_KEY;
  if (!hmacKey) {
    res.status(500).json({ error: "RING_HMAC_SIGNING_KEY is not configured" });
    return;
  }

  const rawBody = await readRawBody(req);
  const signatureHeader = req.headers?.["x-signature"];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

  if (!verifySignature(rawBody, signature, hmacKey)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  console.log("[ring webhook] received event", JSON.stringify(event));
  res.status(200).json({ ok: true });
}
