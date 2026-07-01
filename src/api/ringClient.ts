import axios, { type AxiosError } from "axios";
import { normalizeMany, normalizeOne } from "../utils/jsonApiNormalizer";
import type { JsonApiDocument } from "../types/ring";

// Routed through /api/ring (see api/ring/[...path].ts) rather than calling
// https://api.amazonvision.com directly - the browser can't reach that host
// cross-origin, and never holds the real Ring access token: the proxy
// resolves it server-side from the signed-in session cookie.
const RING_API_BASE_URL = "/api/ring";

export const ringClient = axios.create({ baseURL: RING_API_BASE_URL, withCredentials: true });

function isJsonApiDocument(value: unknown): value is JsonApiDocument {
  return typeof value === "object" && value !== null && "data" in value;
}

ringClient.interceptors.response.use(
  (response) => {
    if (isJsonApiDocument(response.data)) {
      response.data = Array.isArray(response.data.data)
        ? normalizeMany(response.data)
        : normalizeOne(response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    // The proxy already retries a stale Ring token server-side; a 401 here
    // means our own session is invalid or the Ring link couldn't be refreshed.
    if (error.response?.status === 401) {
      window.location.assign("/");
    }
    return Promise.reject(error);
  },
);
