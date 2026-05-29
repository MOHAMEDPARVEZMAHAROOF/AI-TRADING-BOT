import { create } from "zustand";
import type { ActivityEntry, Agent, ScanResult } from "@/lib/types";
import { uid } from "@/lib/utils";

const INITIAL_AGENTS: Agent[] = [
  { id: "scanner", name: "Market Scanner", type: "scanner", status: "IDLE", currentTask: "Idle", tradesAttributed: 0 },
  { id: "analysis", name: "Technical Analyst", type: "analysis", status: "IDLE", currentTask: "Idle", tradesAttributed: 0 },
  { id: "strategy", name: "AI Strategist", type: "strategy", status: "IDLE", currentTask: "Idle", tradesAttributed: 0 },
  { id: "risk", name: "Risk Manager", type: "risk", status: "IDLE", currentTask: "Idle", tradesAttributed: 0 },
  { id: "execution", name: "Execution Agent", type: "execution", status: "IDLE", currentTask: "Idle", tradesAttributed: 0 },
  { id: "portfolio", name: "Portfolio Monitor", type: "portfolio", status: "MONITORING", currentTask: "Watching open positions", tradesAttributed: 0 },
];

interface AgentState {
  isRunning: boolean;
  agents: Agent[];
  activity: ActivityEntry[];
  scanResults: ScanResult[];
  cycleCount: number;
  stocksScanned: number;
  tradesExecuted: number;

  setRunning: (b: boolean) => void;
  setAgentStatus: (id: string, status: Agent["status"], task: string) => void;
  incrementAgentTrades: (id: string) => void;
  log: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
  setScanResults: (results: ScanResult[]) => void;
  incrementCycle: () => void;
  addScanned: (n: number) => void;
  incrementTrades: () => void;
  resetAgents: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  isRunning: false,
  agents: INITIAL_AGENTS,
  activity: [],
  scanResults: [],
  cycleCount: 0,
  stocksScanned: 0,
  tradesExecuted: 0,

  setRunning: (isRunning) => set({ isRunning }),
  setAgentStatus: (id, status, currentTask) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, status, currentTask } : a)),
    })),
  incrementAgentTrades: (id) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, tradesAttributed: a.tradesAttributed + 1 } : a
      ),
    })),
  log: (entry) =>
    set((state) => ({
      activity: [
        { ...entry, id: uid("a_"), timestamp: Date.now() },
        ...state.activity,
      ].slice(0, 300),
    })),
  setScanResults: (scanResults) => set({ scanResults }),
  incrementCycle: () => set((state) => ({ cycleCount: state.cycleCount + 1 })),
  addScanned: (n) => set((state) => ({ stocksScanned: state.stocksScanned + n })),
  incrementTrades: () => set((state) => ({ tradesExecuted: state.tradesExecuted + 1 })),
  resetAgents: () =>
    set({
      agents: INITIAL_AGENTS.map((a) => ({ ...a, status: a.id === "portfolio" ? "MONITORING" : "IDLE", currentTask: a.id === "portfolio" ? "Watching open positions" : "Idle", tradesAttributed: 0 })),
      activity: [],
      scanResults: [],
    }),
}));
