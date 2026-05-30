"use client";

import { formatDistanceToNowStrict } from "date-fns";
import type { Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AutoTradeLog({ trades }: { trades: Trade[] }) {
  const autoTrades = trades.filter((t) => t.source === "auto").slice(0, 20);

  return (
    <div>
      <h3 className="mb-3 font-display text-base font-semibold text-white">Recent Auto-Trades</h3>
      {autoTrades.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-white/35">
          No autonomous trades yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-white/40">
                <th className="pb-2 pr-3 font-medium">Symbol</th>
                <th className="pb-2 pr-3 font-medium">Entry</th>
                <th className="pb-2 pr-3 font-medium">Exit</th>
                <th className="pb-2 pr-3 font-medium">P&L</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 pr-3 font-medium">Pattern</th>
                <th className="pb-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="font-mono-data">
              {autoTrades.map((t) => {
                const pnl = t.pnl ?? 0;
                const win = pnl >= 0;
                return (
                  <tr key={t.id} className="border-t border-white/5">
                    <td className="py-2 pr-3 font-semibold text-white">{t.symbol}</td>
                    <td className="py-2 pr-3 text-white/70">
                      {t.currency}
                      {t.entryPrice.toFixed(2)}
                    </td>
                    <td className="py-2 pr-3 text-white/70">
                      {t.exitPrice != null ? `${t.currency}${t.exitPrice.toFixed(2)}` : "—"}
                    </td>
                    <td className={cn("py-2 pr-3", t.status === "OPEN" ? "text-white/40" : win ? "text-profit" : "text-loss")}>
                      {t.status === "OPEN"
                        ? "open"
                        : `${win ? "+" : ""}${t.currency}${pnl.toFixed(2)}`}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px]",
                          t.status === "TARGET_HIT"
                            ? "bg-profit/15 text-profit"
                            : t.status === "STOP_HIT"
                            ? "bg-loss/15 text-loss"
                            : t.status === "OPEN"
                            ? "bg-info/15 text-info"
                            : "bg-white/10 text-white/60"
                        )}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-white/50">{t.pattern ?? "—"}</td>
                    <td className="py-2 text-white/40">
                      {formatDistanceToNowStrict(t.entryTime, { addSuffix: true })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
