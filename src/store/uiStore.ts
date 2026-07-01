import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  selectedLocationId: string | null;
  liveViewPollingMs: number;
  theme: "light" | "dark";
  setSelectedLocationId: (id: string | null) => void;
  setLiveViewPollingMs: (ms: number) => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      selectedLocationId: null,
      liveViewPollingMs: 10_000,
      theme: "dark",
      setSelectedLocationId: (id) => set({ selectedLocationId: id }),
      setLiveViewPollingMs: (ms) => set({ liveViewPollingMs: ms }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
    }),
    { name: "ring-web-client-ui" },
  ),
);
