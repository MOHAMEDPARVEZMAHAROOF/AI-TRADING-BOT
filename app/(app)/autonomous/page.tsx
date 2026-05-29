"use client";

import { useCallback, useEffect } from "react";
import { Bot, Play, Pause, Square, Activity } from "lucide-react";
import { AgentDashboard } from "@/components/autonomous/AgentDashboard";
import { AgentActivityFeed } from "@/components/autonomous/AgentActivityFeed";
import { MarketScanner } from "@/components/autonomous/MarketScanner";
import { AutoTradeLog } from "@/components/autonomous/AutoTradeLog";
import { useAgentStore } from "@/lib/store/agentStore";
import { usePortfolioStore } from "@/lib/store/portfolioStore";
import { orchestrator } from "@/lib/agents/agentOrchestrator";
import { getMarketQuotes } from "@/lib/api/client";
import { FULL_WATCHLIST } from "@/lib/constants";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { ScanResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AutonomousPage() {
  const hydrated = useHydrated();
  const {
    isRunning,
    agents,
    activity,
    scanResults,
    cycleCount,
    stocksScanned,
    tradesExecuted,
    resetAgents,
  } = useAgentStore();
  const trades = usePortfolioStore((s) => s.trades);
  const getWinRate = usePortfolioStore((s) => s.getWinRate);

  useEffect(() => {
    useAgentStore.getState().setRunning(orchestrator.isRunning);
  }, []);

  // Seed + keep the scanner populated with live quotes for the whole watchlist.
  const refreshWatchlist = useCallback(async () => {
    const quotes = await getMarketQuotes(FULL_WATCHLIST);
    if (!quotes.length) return;
    const store = useAgentStore.getState();
    const existing = new Map(store.scanResults.map((r) => [r.symbol, r]));
    const merged: ScanResult[] = quotes.map((q) => {
      const prev = existing.get(q.symbol);
      const strength = Math.min(100, Math.round(45 + Math.abs(q.changePercent) * 6));
      return {
        symbol: q.symbol,
        price: q.price,
        changePercent: q.changePercent,
        volume: q.volume,
        score: prev?.score ?? strength,
        signalStrength: prev?.flagged ? prev.signalStrength : strength,
        flagged: prev?.flagged ?? false,
        reason: prev?.reason ?? "live quote",
      };
    });
    store.setScanResults(merged);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    refreshWatchlist();
    const id = setInterval(refreshWatchlist, 20_000);
    return () => clearInterval(id);
  }, [hydrated, refreshWatchlist]);

  const winRate = hydrated ? getWinRate() : 0;

  const start = () => orchestrator.start();
  const pause = () => orchestrator.stop();
  const stop = () => {
    orchestrator.stop();
    resetAgents();
    refreshWatchlist();
  };

  return (
    <div className="mx-auto max-w-[1700px] space-y-4">
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-agent/30 to-gold-primary/20">
            <Bot className="h-6 w-6 text-gold-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">Autonomous AI Trader</h2>
            <p className="flex items-center gap-1.5 text-xs text-white/50">
              <span className={cn("h-2 w-2 rounded-full", isRunning ? "animate-pulse bg-profit" : "bg-white/30")} />
              {isRunning ? "Live — agents working autonomously" : "Stopped — scanning live prices"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={start}
            disabled={isRunning}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              isRunning
                ? "cursor-not-allowed bg-white/5 text-white/30"
                : "bg-gradient-to-r from-profit to-emerald-400 text-bg-primary hover:shadow-[0_0_24px_rgba(0,255,136,0.3)]"
            )}
          >
            <Play className="h-4 w-4" /> Start
          </button>
          <button
            onClick={pause}
            disabled={!isRunning}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
              isRunning
                ? "border-gold-primary/40 text-gold-primary hover:bg-gold-primary/10"
                : "cursor-not-allowed border-white/10 text-white/30"
            )}
          >
            <Pause className="h-4 w-4" /> Pause
          </button>
          <button
            onClick={stop}
            className="flex items-center gap-2 rounded-xl border border-loss/40 px-4 py-2.5 text-sm font-semibold text-loss transition hover:bg-loss/10"
          >
            <Square className="h-4 w-4" /> Stop
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Cycle Count" value={hydrated ? String(cycleCount) : "—"} />
        <StatCard label="Stocks Scanned" value={hydrated ? stocksScanned.toLocaleString() : "—"} />
        <StatCard label="Trades Executed" value={hydrated ? String(tradesExecuted) : "—"} />
        <StatCard label="Win Rate" value={hydrated ? `${winRate.toFixed(0)}%` : "—"} accent />
      </div>

      <div className="rounded-xl border border-gold-primary/15 bg-gold-primary/5 px-4 py-2 text-center text-xs text-gold-primary">
        {isRunning
          ? "Agents are scanning, analysing and executing paper trades automatically."
          : "Press Start to let the AI agents scan the market and trade autonomously (cycle every 30s)."}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="glass-card p-4">
          <AgentDashboard agents={agents} />
        </div>
        <div className="glass-card p-4">
          <AgentActivityFeed activity={activity} />
        </div>
        <div className="glass-card p-4">
          <MarketScanner results={scanResults} />
        </div>
      </div>

      <div className="glass-card p-4">
        <AutoTradeLog trades={trades} />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass-card glass-card-hover flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-primary/10">
        <Activity className="h-5 w-5 text-gold-primary" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
        <div className={cn("font-mono-data text-xl font-bold", accent ? "text-gold-primary" : "text-white")}>
          {value}
        </div>
      </div>
    </div>
  );
}
