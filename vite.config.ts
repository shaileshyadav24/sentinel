import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tokenExchangeHandler from "./api/token-exchange.ts";
import { proxyRingApiRequest } from "./api/_ringProxy.ts";
import ringLinkHandler from "./api/ring/link.ts";
import ringWebhookHandler from "./api/ring/webhook.ts";
import authSignupHandler from "./api/auth/signup.ts";
import authLoginHandler from "./api/auth/login.ts";
import authLogoutHandler from "./api/auth/logout.ts";
import authMeHandler from "./api/auth/me.ts";
import type { IncomingRequest, OutgoingResponse } from "./api/_http.ts";

async function readRawBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

function createResponseAdapter(res: ServerResponse): OutgoingResponse {
  const adapter: OutgoingResponse = {
    status(code: number) {
      res.statusCode = code;
      return adapter;
    },
    json(payload: unknown) {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(payload));
    },
    setHeader(name: string, value: string | string[]) {
      res.setHeader(name, value);
    },
  };
  return adapter;
}

type ConnectMiddleware = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

/** A thrown/rejected handler (e.g. KV not configured yet) must still produce
 * a response - Vercel's runtime does this automatically, but connect
 * middleware here would otherwise hang the request indefinitely. */
function withErrorHandling(middleware: ConnectMiddleware): ConnectMiddleware {
  return async (req, res) => {
    try {
      await middleware(req, res);
    } catch (err) {
      console.error(`[dev api] ${req.method} ${req.url} failed:`, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "Internal error", detail: String(err) }));
      }
    }
  };
}

/** Wraps a JSON-in/JSON-out serverless handler (api/_http.ts shape) as connect middleware. */
function jsonHandler(handler: (req: IncomingRequest, res: OutgoingResponse) => Promise<void>) {
  return withErrorHandling(async (req, res) => {
    const raw = await readRawBody(req);
    let body: unknown;
    try {
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      // Ring's exact request shape to the token-exchange webhook is
      // undocumented and may not be JSON - keep the raw string around so
      // handlers can fall back to parsing it themselves (see
      // extractCode in api/token-exchange.ts).
      body = raw || undefined;
    }

    await handler(
      {
        method: req.method,
        url: req.url,
        headers: req.headers as Record<string, string | string[] | undefined>,
        body,
      },
      createResponseAdapter(res),
    );
  });
}

// `npm run dev` only serves the frontend; Vercel's serverless functions
// (api/*.ts) aren't run by Vite on their own. This middleware invokes the
// same handlers in-process so the whole /api surface works under
// `npm run dev` too, without needing the separate `vercel dev` CLI.
function ringApiDevMiddleware(): Plugin {
  return {
    name: "ring-api-dev-middleware",
    configureServer(server) {
      server.middlewares.use("/api/token-exchange", jsonHandler(tokenExchangeHandler));

      server.middlewares.use("/api/auth/signup", jsonHandler(authSignupHandler));
      server.middlewares.use("/api/auth/login", jsonHandler(authLoginHandler));
      server.middlewares.use("/api/auth/logout", jsonHandler(authLogoutHandler));
      server.middlewares.use("/api/auth/me", jsonHandler(authMeHandler));

      // Ring's device-event webhook needs the exact raw bytes for HMAC
      // verification, so it reads the request itself rather than going
      // through the JSON-parsing jsonHandler wrapper above.
      server.middlewares.use(
        "/api/ring/webhook",
        withErrorHandling(async (req, res) => {
          await ringWebhookHandler(req, createResponseAdapter(res));
        }),
      );

      // Must be registered before the "/api/ring" catch-all below, since
      // connect matches by prefix in registration order.
      server.middlewares.use("/api/ring/link", jsonHandler(ringLinkHandler));

      server.middlewares.use("/api/ring", withErrorHandling(async (req, res) => {
        // connect strips the "/api/ring" mount prefix from req.url before
        // invoking this handler, so req.url here is already just the
        // upstream path + query string (e.g. "/v1/devices?include=...").
        const raw = await readRawBody(req);
        let body: unknown;
        if (raw) {
          try {
            body = JSON.parse(raw);
          } catch {
            body = undefined;
          }
        }

        const url = new URL(req.url ?? "/", "http://localhost");
        const cookieHeader = req.headers.cookie;

        const result = await proxyRingApiRequest({
          method: req.method ?? "GET",
          path: url.pathname,
          search: url.search,
          cookieHeader: typeof cookieHeader === "string" ? cookieHeader : undefined,
          body,
        });

        res.statusCode = result.status;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(result.body));
      }));
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vite only exposes .env vars to client code as import.meta.env.VITE_* -
  // it doesn't populate process.env for server-side code on its own. The
  // dev middleware above reads process.env directly (matching how Vercel
  // injects env vars in production), so load the full .env file (the ""
  // prefix means "no filtering, load everything") into process.env here.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    plugins: [react(), tailwindcss(), ringApiDevMiddleware()],
  };
});
