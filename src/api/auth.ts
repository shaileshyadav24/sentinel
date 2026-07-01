import axios from "axios";
import { OAUTH_TOKEN, SESSION } from "./ringEndpoints";
import type { RingOAuthTokens, RingProfile } from "../types/ring";

const RING_CLIENT_ID = "ring_official_android";

export class TwoFactorRequiredError extends Error {
  phone?: string;
  constructor(phone?: string) {
    super("Two-factor authentication code required");
    this.name = "TwoFactorRequiredError";
    this.phone = phone;
  }
}

export class RingAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RingAuthError";
  }
}

interface LoginParams {
  username: string;
  password: string;
  hardwareId: string;
  twoFactorCode?: string;
}

export async function login({
  username,
  password,
  hardwareId,
  twoFactorCode,
}: LoginParams): Promise<RingOAuthTokens> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "2fa-support": "true",
    "hardware_id": hardwareId,
  };
  if (twoFactorCode) headers["2fa-code"] = twoFactorCode;

  try {
    const { data } = await axios.post(
      OAUTH_TOKEN,
      {
        client_id: RING_CLIENT_ID,
        grant_type: "password",
        password,
        username,
        scope: "client",
      },
      { headers },
    );
    return { ...data, obtainedAt: Date.now() };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 412) {
      const phone = err.response.data?.phone as string | undefined;
      throw new TwoFactorRequiredError(phone);
    }
    if (axios.isAxiosError(err) && err.response?.status === 429) {
      throw new RingAuthError("Too many attempts. Ring is rate-limiting this account, try again later.");
    }
    throw new RingAuthError(
      axios.isAxiosError(err) ? err.response?.data?.error_description ?? err.message : "Login failed",
    );
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<RingOAuthTokens> {
  const { data } = await axios.post(
    OAUTH_TOKEN,
    { client_id: RING_CLIENT_ID, grant_type: "refresh_token", refresh_token: refreshToken },
    { headers: { "content-type": "application/json" } },
  );
  return { ...data, obtainedAt: Date.now() };
}

export async function establishSession(
  accessToken: string,
  hardwareId: string,
): Promise<RingProfile> {
  const { data } = await axios.post(
    SESSION,
    {
      device: {
        hardware_id: hardwareId,
        metadata: { api_version: "11" },
        os: "android",
      },
    },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data.profile as RingProfile;
}

export function generateHardwareId(): string {
  return crypto.randomUUID();
}
