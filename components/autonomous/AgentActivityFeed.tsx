"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import type { ActivityEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "ALL" | "TRADES" | "ANALYSIS" | "ALERTS";

const CATEGORY_COLOR: Record<string, string> = {
  scan: "border-info text-info",
  analysis: "border-gold-primary text-gold-primary",
  decision: "border-agent text-agent",
  trade: "border-profit text-profit",
  alert: "border-loss text-loss",
};

const FILTERS: Record<Filter, (c: ActivityEntry["category"]) => boolean> = {
  ALL: () => true,
  TRADES: (c) => c === "trade",
  ANALYSIS: (c) => c === "analysis" || c === "decision",
  ALERTS: (c) => c === "alert" || c === "scan",
};

export function AgentActivityFeed({ activity }: { activity: ActivityEntry[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const filtered = activity.filter((a) => FILTERS[filter](a.category));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white">Live Activity</h3>
        <div className="flex gap-1">
          {(Object.keys(FILTERS) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] uppercase tracking-wide transition",
                filter === f ? "bg-gold-primary/15 text-gold-primary" : "text-white/45 hover:bg-white/5"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 560 }}>
        {filtered.length === 0 && (
          <div className="flex h-40 items-center justify-center text-sm text-white/35">
            No activity yet. Start the agents to see live actions.
          </div>
        )}
        <AnimatePresence initial={false}>
          {filtered.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "rounded-lg border-l-2 bg-white/[0.02] px-3 py-2",
                CATEGORY_COLOR[a.category] ?? "border-white/20"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("text-xs font-semibold", CATEGORY_COLOR[a.category]?.split(" ")[1])}>
                  {a.agentName}
                </span>
                <span className="font-mono-data text-[10px] text-white/35">
                  {format(a.timestamp, "HH:mm:ss")}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/75">
                {a.symbol && <span className="font-mono-data text-white">{a.symbol} </span>}
                {a.action}
              </p>
              {a.detail && <p className="mt-0.5 text-[10px] text-white/40">{a.detail}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
