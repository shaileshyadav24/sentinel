import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Dev-time equivalent of api/ring/[...path].js, so `npm run dev` can reach
// Ring's API without needing `vercel dev`. Same shared handler, different
// req/res adapter (Node's raw http vs Vercel's).
function ringProxyDevPlugin(): Plugin {
  return {
    name: "ring-proxy-dev-middleware",
    configureServer(server) {
      server.middlewares.use("/api/ring", async (req, res) => {
        const { proxyRingRequest, CORS_HEADERS } = await import("./api/_ringProxyHandler.js");

        if (req.method === "OPTIONS") {
          res.writeHead(204, CORS_HEADERS);
          res.end();
          return;
        }

        const url = new URL(req.url ?? "/", "http://localhost");
        const segments = url.pathname.split("/").filter(Boolean);

        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const body = chunks.length ? Buffer.concat(chunks) : undefined;

        const result = await proxyRingRequest({
          segments,
          query: url.searchParams.toString(),
          method: req.method ?? "GET",
          headers: req.headers as Record<string, string>,
          body,
        });

        res.writeHead(result.status, { ...result.headers, ...CORS_HEADERS });
        res.end(result.body);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ringProxyDevPlugin()],
});
