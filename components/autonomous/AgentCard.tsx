"use client";

import { motion } from "framer-motion";
import { Radar, LineChart, BrainCircuit, ShieldCheck, Zap, Activity } from "lucide-react";
import type { Agent, AgentType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<AgentType, React.ComponentType<{ className?: string }>> = {
  scanner: Radar,
  analysis: LineChart,
  strategy: BrainCircuit,
  risk: ShieldCheck,
  execution: Zap,
  portfolio: Activity,
};

const STATUS_COLOR: Record<string, string> = {
  IDLE: "bg-white/30",
  SCANNING: "bg-info",
  ANALYSING: "bg-gold-primary",
  DECIDING: "bg-agent",
  EXECUTING: "bg-profit",
  MONITORING: "bg-info",
};

export function AgentCard({ agent }: { agent: Agent }) {
  const Icon = ICONS[agent.type];
  const active = agent.status !== "IDLE";

  return (
    <motion.div
      layout
      className={cn(
        "glass-card glass-card-hover p-3.5 transition",
        active && "border-gold-primary/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            active ? "bg-gold-primary/15" : "bg-white/5"
          )}
        >
          <Icon className={cn("h-5 w-5", active ? "text-gold-primary" : "text-white/40")} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-white">{agent.name}</span>
            <span className="flex items-center gap-1.5">
              <span className={cn("relative flex h-2 w-2", active && "animate-pulse")}>
                <span className={cn("h-2 w-2 rounded-full", STATUS_COLOR[agent.status])} />
              </span>
              <span className="text-[10px] uppercase tracking-wide text-white/45">
                {agent.status}
              </span>
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-white/55">{agent.currentTask}</p>
          {agent.tradesAttributed > 0 && (
            <p className="mt-1 text-[10px] text-gold-primary">
              {agent.tradesAttributed} trade{agent.tradesAttributed > 1 ? "s" : ""} executed
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
