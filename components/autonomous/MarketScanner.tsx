"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ScanResult } from "@/lib/types";
import { cn, currencyForSymbol, formatPercent } from "@/lib/utils";

type Sort = "signal" | "volume" | "movement";

export function MarketScanner({ results }: { results: ScanResult[] }) {
  const [sort, setSort] = useState<Sort>("signal");

  const sorted = [...results].sort((a, b) => {
    if (sort === "signal") return b.signalStrength - a.signalStrength;
    if (sort === "volume") return b.volume - a.volume;
    return Math.abs(b.changePercent) - Math.abs(a.changePercent);
  });

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white">Market Scanner</h3>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-md border border-white/10 bg-bg-secondary px-2 py-1 text-[11px] text-white/70 focus:outline-none"
        >
          <option value="signal">Signal Strength</option>
          <option value="volume">Volume</option>
          <option value="movement">Movement</option>
        </select>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 560 }}>
        {sorted.length === 0 && (
          <div className="flex h-40 items-center justify-center text-sm text-white/35">
            Scanner idle — start the agents.
          </div>
        )}
        {sorted.map((r) => {
          const up = r.changePercent >= 0;
          return (
            <motion.div
              key={r.symbol}
              layout
              animate={r.flagged ? { boxShadow: ["0 0 0 rgba(255,215,0,0)", "0 0 16px rgba(255,215,0,0.4)", "0 0 0 rgba(255,215,0,0)"] } : {}}
              transition={{ duration: 1.2 }}
              className={cn(
                "rounded-lg border bg-white/[0.02] px-3 py-2",
                r.flagged ? "border-gold-primary/40" : "border-white/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono-data text-sm font-semibold text-white">{r.symbol}</span>
                <span className="font-mono-data text-sm text-white/80">
                  {currencyForSymbol(r.symbol)}
                  {r.price.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        r.score >= 72 ? "bg-gold-primary" : r.score >= 55 ? "bg-info" : "bg-white/30"
                      )}
                      style={{ width: `${r.signalStrength}%` }}
                    />
                  </div>
                </div>
                <span className={cn("font-mono-data text-xs", up ? "text-profit" : "text-loss")}>
                  {formatPercent(r.changePercent)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
