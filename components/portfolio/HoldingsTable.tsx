"use client";

import toast from "react-hot-toast";
import { ChevronRight } from "lucide-react";
import type { Holding } from "@/lib/types";
import { usePortfolioStore } from "@/lib/store/portfolioStore";
import { SignalBadge } from "@/components/shared/SignalBadge";
import { cn } from "@/lib/utils";

export function HoldingsTable({
  holdings,
  onSelect,
}: {
  holdings: Holding[];
  onSelect?: (symbol: string) => void;
}) {
  const closePosition = usePortfolioStore((s) => s.closePosition);

  if (holdings.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center text-center text-sm text-white/35">
        No open positions.
        <span className="mt-1 text-xs text-white/25">
          Execute a trade from the AI Trader or let the autonomous agents work.
        </span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-white/40">
            <th className="pb-2 pr-3 font-medium">Symbol</th>
            <th className="pb-2 pr-3 font-medium">Qty</th>
            <th className="pb-2 pr-3 font-medium">Avg Entry</th>
            <th className="pb-2 pr-3 font-medium">Current</th>
            <th className="pb-2 pr-3 font-medium">Value</th>
            <th className="pb-2 pr-3 font-medium">P&L</th>
            <th className="pb-2 pr-3 font-medium">P&L%</th>
            <th className="pb-2 pr-3 font-medium">Signal</th>
            <th className="pb-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="font-mono-data">
          {holdings.map((h) => {
            const value = h.currentPrice * h.quantity;
            const pnl = (h.currentPrice - h.avgEntry) * h.quantity;
            const pnlPct = ((h.currentPrice - h.avgEntry) / h.avgEntry) * 100;
            const win = pnl >= 0;
            return (
              <tr
                key={h.symbol}
                onClick={() => onSelect?.(h.symbol)}
                className="cursor-pointer border-t border-white/5 transition hover:bg-white/[0.03]"
              >
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <ChevronRight className="h-3.5 w-3.5 text-gold-primary/60" />
                    {h.symbol}
                  </div>
                  <div className="pl-5 font-sans text-[10px] text-white/40">
                    {h.source === "auto" ? "🤖 Auto" : "Manual"}
                  </div>
                </td>
                <td className="py-2.5 pr-3 text-white/70">{h.quantity}</td>
                <td className="py-2.5 pr-3 text-white/70">{h.currency}{h.avgEntry.toFixed(2)}</td>
                <td className="py-2.5 pr-3 text-white/90">{h.currency}{h.currentPrice.toFixed(2)}</td>
                <td className="py-2.5 pr-3 text-white/70">{h.currency}{value.toFixed(2)}</td>
                <td className={cn("py-2.5 pr-3", win ? "text-profit" : "text-loss")}>
                  {win ? "+" : ""}{h.currency}{pnl.toFixed(2)}
                </td>
                <td className={cn("py-2.5 pr-3", win ? "text-profit" : "text-loss")}>
                  {win ? "+" : ""}{pnlPct.toFixed(1)}%
                </td>
                <td className="py-2.5 pr-3">
                  {h.aiSignal ? (
                    <SignalBadge signal={h.aiSignal} size="sm" animate={false} />
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.(h.symbol);
                      }}
                      className="rounded-lg border border-gold-primary/25 px-2.5 py-1 text-xs font-sans text-gold-primary transition hover:bg-gold-primary/10"
                    >
                      Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closePosition(h.symbol, h.currentPrice);
                        toast.success(`Closed ${h.symbol}`);
                      }}
                      className="rounded-lg border border-loss/30 px-2.5 py-1 text-xs font-sans text-loss transition hover:bg-loss/10"
                    >
                      Close
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
