import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LiveBotMarket, LiveBotState } from "@/lib/types";
import { liveBotSchedule } from "@/lib/market/marketHours";

function defaultState(market: LiveBotMarket): LiveBotState {
  return {
    market,
    isRunning: false,
    startedAt: null,
    lastTickAt: null,
    cycleCount: 0,
    tradesExecuted: 0,
    schedule: liveBotSchedule(market),
    userStopped: true,
  };
}

interface LiveBotStore {
  crypto: LiveBotState;
  forex: LiveBotState;
  setFromServer: (market: LiveBotMarket, patch: Partial<LiveBotState>) => void;
  applyLocalStart: (market: LiveBotMarket) => void;
  applyLocalStop: (market: LiveBotMarket) => void;
}

export const useLiveBotStore = create<LiveBotStore>()(
  persist(
    (set) => ({
      crypto: defaultState("crypto"),
      forex: defaultState("forex"),
      setFromServer: (market, patch) =>
        set((s) => ({
          [market]: { ...s[market], ...patch },
        })),
      applyLocalStart: (market) =>
        set((s) => ({
          [market]: {
            ...s[market],
            isRunning: true,
            userStopped: false,
            startedAt: Date.now(),
            schedule: liveBotSchedule(market),
          },
        })),
      applyLocalStop: (market) =>
        set((s) => ({
          [market]: {
            ...s[market],
            isRunning: false,
            userStopped: true,
          },
        })),
    }),
    { name: "aurum-live-bots" }
  )
);
