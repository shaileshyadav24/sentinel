// Minimal Upstash Redis REST client. Uses the plain HTTPS command API
// (POST a JSON command array to the base URL) rather than a Redis wire
// protocol client, since serverless functions shouldn't hold a persistent
// TCP connection. Env vars match what Vercel's KV/Upstash integration
// injects automatically: KV_REST_API_URL, KV_REST_API_TOKEN.

async function command<T = unknown>(args: (string | number)[]): Promise<T> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("KV_REST_API_URL/KV_REST_API_TOKEN are not configured");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(args),
  });

  const data = (await res.json()) as { result: T; error?: string };
  if (!res.ok || data.error) {
    throw new Error(data.error ?? `KV command failed with status ${res.status}`);
  }
  return data.result;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const raw = await command<string | null>(["GET", key]);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function kvSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const args: (string | number)[] = ["SET", key, JSON.stringify(value)];
  if (ttlSeconds) args.push("EX", ttlSeconds);
  await command(args);
}

export async function kvDel(key: string): Promise<void> {
  await command(["DEL", key]);
}

export async function kvSadd(key: string, member: string): Promise<void> {
  await command(["SADD", key, member]);
}

export async function kvSrem(key: string, member: string): Promise<void> {
  await command(["SREM", key, member]);
}

export async function kvSmembers(key: string): Promise<string[]> {
  const result = await command<string[] | null>(["SMEMBERS", key]);
  return result ?? [];
}
