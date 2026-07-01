// Generic, stateless pass-through proxy to Ring's private API.
//
// This exists ONLY to work around browser CORS: Ring's API is not designed
// to be called from a third-party web origin, so a pure client-side SPA
// cannot reach it directly. This proxy adds no logic, no storage, no
// database - it just forwards the request byte-for-byte to Ring and relays
// the response back with permissive CORS headers. Auth tokens live only in
// the browser (see src/store/authStore.ts); this function never sees or
// persists them beyond the lifetime of a single request.
//
// Path convention (everything after /api/ring/ is forwarded verbatim):
//   /api/ring/oauth/*  -> https://oauth.ring.com/*
//   /api/ring/api/*    -> https://api.ring.com/*
//   /api/ring/app/*    -> https://app.ring.com/api/*

const UPSTREAMS = {
  oauth: "https://oauth.ring.com",
  api: "https://api.ring.com",
  app: "https://app.ring.com/api",
};

const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "origin",
  "referer",
  "accept-encoding",
]);

const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "transfer-encoding",
  "connection",
  "content-length",
]);

/**
 * @param {{ segments: string[], method: string, headers: Record<string,string>, body: Buffer | undefined }} req
 * @returns {Promise<{ status: number, headers: Record<string,string>, body: Buffer }>}
 */
export async function proxyRingRequest(req) {
  const [prefix, ...rest] = req.segments;
  const upstreamBase = UPSTREAMS[prefix];

  if (!upstreamBase) {
    return jsonResponse(400, {
      error: `Unknown Ring API prefix "${prefix}". Expected one of: ${Object.keys(UPSTREAMS).join(", ")}`,
    });
  }

  const targetUrl = `${upstreamBase}/${rest.join("/")}${req.query ? `?${req.query}` : ""}`;

  const forwardHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase()) && value != null) {
      forwardHeaders[key] = value;
    }
  }
  forwardHeaders["user-agent"] = "android:com.ringapp";

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
    });
  } catch (err) {
    return jsonResponse(502, { error: "Failed to reach Ring API", detail: String(err) });
  }

  const responseHeaders = {};
  upstreamResponse.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders[key] = value;
    }
  });

  const bodyBuffer = Buffer.from(await upstreamResponse.arrayBuffer());

  return {
    status: upstreamResponse.status,
    headers: responseHeaders,
    body: bodyBuffer,
  };
}

function jsonResponse(status, obj) {
  return {
    status,
    headers: { "content-type": "application/json" },
    body: Buffer.from(JSON.stringify(obj)),
  };
}

export const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "access-control-allow-headers": "*",
};
