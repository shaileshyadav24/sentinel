import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RingOAuthTokens, RingProfile } from "../types/ring";
import { generateHardwareId, refreshAccessToken } from "../api/auth";

interface AuthState {
  tokens: RingOAuthTokens | null;
  profile: RingProfile | null;
  hardwareId: string;
  isAuthenticated: boolean;
  setTokens: (tokens: RingOAuthTokens) => void;
  setProfile: (profile: RingProfile) => void;
  logout: () => void;
  /** returns a valid access token, refreshing first if it's close to expiry */
  getValidAccessToken: () => Promise<string | null>;
}

const REFRESH_MARGIN_MS = 60_000;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      profile: null,
      hardwareId: generateHardwareId(),
      isAuthenticated: false,

      setTokens: (tokens) => set({ tokens, isAuthenticated: true }),
      setProfile: (profile) => set({ profile }),
      logout: () => set({ tokens: null, profile: null, isAuthenticated: false }),

      getValidAccessToken: async () => {
        const { tokens } = get();
        if (!tokens) return null;

        const expiresAt = tokens.obtainedAt + tokens.expires_in * 1000;
        if (Date.now() < expiresAt - REFRESH_MARGIN_MS) {
          return tokens.access_token;
        }

        try {
          const refreshed = await refreshAccessToken(tokens.refresh_token);
          set({ tokens: refreshed, isAuthenticated: true });
          return refreshed.access_token;
        } catch {
          set({ tokens: null, profile: null, isAuthenticated: false });
          return null;
        }
      },
    }),
    {
      name: "ring-web-client-auth",
      partialize: (state) => ({
        tokens: state.tokens,
        profile: state.profile,
        hardwareId: state.hardwareId,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
