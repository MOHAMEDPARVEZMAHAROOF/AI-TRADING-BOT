"use client";

import { useEffect, useState } from "react";
import { getAllMarketStatuses } from "@/lib/market/marketHours";
import type { MarketSessionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const SHORT: Record<string, string> = {
  india: "IN",
  us: "US",
  crypto: "Crypto",
  forex: "FX",
};

export function MarketStatusChips() {
  const [sessions, setSessions] = useState<MarketSessionStatus[]>([]);

  useEffect(() => {
    const refresh = () => setSessions(getAllMarketStatuses());
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!sessions.length) return null;

  return (
    <div className="hidden items-center gap-1.5 lg:flex">
      {sessions.map((s) => (
        <span
          key={s.region}
          title={`${s.label} — ${s.scheduleLabel}`}
          className={cn(
            "flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium",
            s.isOpen
              ? "border-profit/25 bg-profit/10 text-profit"
              : "border-white/10 bg-white/5 text-white/40"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              s.isOpen ? "animate-pulse bg-profit" : "bg-white/30"
            )}
          />
          {SHORT[s.region]}
        </span>
      ))}
    </div>
  );
}
