// Minimal request/response shape shared by every serverless handler here.
// Structurally compatible with both Vercel's actual Node request/response
// objects and the Vite dev-middleware adapters in vite.config.ts, so the
// same handler runs unmodified under `npm run dev` and on Vercel.

export interface IncomingRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface OutgoingResponse {
  status: (code: number) => OutgoingResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string | string[]) => void;
}
