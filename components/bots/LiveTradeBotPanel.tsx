"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, Play, Square, Zap, Shield, Cloud } from "lucide-react";
import toast from "react-hot-toast";
import { liveBotOrchestrator } from "@/lib/agents/liveBotOrchestrator";
import {
  fetchLiveBotStatus,
  startLiveBot,
  stopLiveBot,
  subscribeLiveBotSync,
} from "@/lib/bots/liveBotClient";
import { useLiveBotStore } from "@/lib/store/liveBotStore";
import { canLiveBotRun, liveBotSchedule } from "@/lib/market/marketHours";
import type { LiveBotMarket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/hooks/useHydrated";

const COPY: Record<
  LiveBotMarket,
  { title: string; subtitle: string; schedule: string; accent: string }
> = {
  crypto: {
    title: "24/7 Live Trade Bot",
    subtitle:
      "Cloud agentic layers scan crypto markets around the clock. Stays active until you stop — even if you close the browser.",
    schedule: "24 hours · 7 days",
    accent: "from-violet-500/20 to-gold-primary/10",
  },
  forex: {
    title: "24/5 Live Trade Bot",
    subtitle:
      "Forex agent network runs Sunday evening through Friday (ET). Pauses on weekends; resumes automatically when markets reopen.",
    schedule: "24/5 · weekends closed",
    accent: "from-emerald-500/20 to-gold-primary/10",
  },
};

export function LiveTradeBotPanel({ market }: { market: LiveBotMarket }) {
  const hydrated = useHydrated();
  const bot = useLiveBotStore((s) => s[market]);
  const setFromServer = useLiveBotStore((s) => s.setFromServer);
  const applyLocalStart = useLiveBotStore((s) => s.applyLocalStart);
  const applyLocalStop = useLiveBotStore((s) => s.applyLocalStop);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meta = COPY[market];

  const syncServer = useCallback(
    (state: typeof bot) => {
      setFromServer(market, state);
      liveBotOrchestrator.resumeIfNeeded(market, state.isRunning && !state.userStopped);
    },
    [market, setFromServer]
  );

  useEffect(() => {
    if (!hydrated) return;
    return subscribeLiveBotSync(market, syncServer);
  }, [hydrated, market, syncServer]);

  useEffect(() => {
    if (!bot.isRunning || bot.userStopped) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    const runTick = () => {
      void fetch(`/api/bots/${market}/tick`, { method: "POST", credentials: "include" });
    };
    runTick();
    tickRef.current = setInterval(runTick, 30_000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [bot.isRunning, bot.userStopped, market]);

  const handleStart = async () => {
    if (market === "forex" && !canLiveBotRun("forex")) {
      toast.error("Forex markets are closed for the weekend.");
      return;
    }
    try {
      applyLocalStart(market);
      liveBotOrchestrator.start(market);
      const server = await startLiveBot(market);
      if (server) syncServer(server);
      toast.success(`${meta.title} activated — running on Aurum cloud`);
    } catch (err) {
      applyLocalStop(market);
      liveBotOrchestrator.stop(market);
      toast.error((err as Error).message);
    }
  };

  const handleStop = async () => {
    try {
      liveBotOrchestrator.stop(market);
      applyLocalStop(market);
      const server = await stopLiveBot(market);
      if (server) syncServer(server);
      toast("Live bot stopped", { icon: "⏹" });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    void fetchLiveBotStatus(market).then((s) => {
      if (s) syncServer(s);
    });
  }, [hydrated, market, syncServer]);

  const running = bot.isRunning && !bot.userStopped;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-card relative overflow-hidden border-gold-primary/20 p-5 md:p-6",
        `bg-gradient-to-br ${meta.accent}`
      )}
    >
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-gold-primary/5 blur-3xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-primary/25 to-agent/20 ring-1 ring-gold-primary/30">
            <Bot className="h-7 w-7 text-gold-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold text-white md:text-2xl">
                {meta.title}
              </h2>
              <span className="rounded-full bg-gold-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-primary">
                {liveBotSchedule(market)}
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/55">
              {meta.subtitle}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-white/45">
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-gold-primary" /> 6 agentic layers
              </span>
              <span className="flex items-center gap-1">
                <Cloud className="h-3.5 w-3.5 text-gold-primary" /> Cloud persistence
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-gold-primary" /> Risk-managed paper trades
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row lg:flex-col lg:items-end">
          <div className="flex gap-4 text-center sm:text-right">
            <Stat label="Cycles" value={hydrated ? String(bot.cycleCount) : "—"} />
            <Stat label="Schedule" value={meta.schedule.split("·")[0].trim()} />
            <Stat
              label="Status"
              value={running ? "LIVE" : "Idle"}
              live={running}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleStart}
              disabled={running}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition sm:flex-none",
                running
                  ? "cursor-not-allowed bg-white/5 text-white/30"
                  : "bg-gradient-to-r from-profit to-emerald-400 text-bg-primary shadow-[0_0_28px_rgba(0,255,136,0.25)]"
              )}
            >
              <Play className="h-4 w-4" /> Start bot
            </button>
            <button
              onClick={handleStop}
              disabled={!running}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition sm:flex-none",
                running
                  ? "border-loss/50 text-loss hover:bg-loss/10"
                  : "cursor-not-allowed border-white/10 text-white/30"
              )}
            >
              <Square className="h-4 w-4" /> Stop
            </button>
          </div>
        </div>
      </div>

      {running && (
        <motion.div
          className="relative mt-4 flex items-center gap-2 rounded-lg border border-profit/20 bg-profit/5 px-3 py-2 text-xs text-profit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-profit" />
          Bot is analysing markets on Aurum servers
          {bot.lastTickAt
            ? ` · last tick ${new Date(bot.lastTickAt).toLocaleTimeString()}`
            : ""}
        </motion.div>
      )}
    </motion.section>
  );
}

function Stat({
  label,
  value,
  live,
}: {
  label: string;
  value: string;
  live?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
      <div
        className={cn(
          "font-mono-data text-lg font-bold",
          live ? "text-profit" : "text-white"
        )}
      >
        {value}
      </div>
    </div>
  );
}
