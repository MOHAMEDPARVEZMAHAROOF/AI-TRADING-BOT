"use client";

import { Download } from "lucide-react";
import { format, formatDistanceStrict } from "date-fns";
import type { Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TradeHistoryTable({
  trades,
  onSelect,
}: {
  trades: Trade[];
  onSelect?: (symbol: string) => void;
}) {
  const closed = trades.filter((t) => t.status !== "OPEN");

  const exportCSV = () => {
    const header = [
      "Symbol", "Type", "Source", "Entry", "Exit", "Qty", "PnL", "PnL%", "Status", "Pattern", "EntryTime", "ExitTime",
    ];
    const rows = closed.map((t) => [
      t.symbol,
      t.type,
      t.source,
      t.entryPrice,
      t.exitPrice ?? "",
      t.quantity,
      t.pnl?.toFixed(2) ?? "",
      t.pnlPercent?.toFixed(2) ?? "",
      t.status,
      t.pattern ?? "",
      new Date(t.entryTime).toISOString(),
      t.exitTime ? new Date(t.exitTime).toISOString() : "",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trade-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white">Trade History</h3>
        <button
          onClick={exportCSV}
          disabled={closed.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-gold-primary/20 px-3 py-1.5 text-xs text-gold-primary transition hover:bg-gold-primary/10 disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {closed.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-white/35">
          No closed trades yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-white/40">
                <th className="pb-2 pr-3 font-medium">Symbol</th>
                <th className="pb-2 pr-3 font-medium">Type</th>
                <th className="pb-2 pr-3 font-medium">Entry</th>
                <th className="pb-2 pr-3 font-medium">Exit</th>
                <th className="pb-2 pr-3 font-medium">Qty</th>
                <th className="pb-2 pr-3 font-medium">P&L</th>
                <th className="pb-2 pr-3 font-medium">Duration</th>
                <th className="pb-2 pr-3 font-medium">Pattern</th>
                <th className="pb-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="font-mono-data">
              {closed.map((t) => {
                const win = (t.pnl ?? 0) >= 0;
                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelect?.(t.symbol)}
                    className="cursor-pointer border-t border-white/5 transition hover:bg-white/[0.03]"
                  >
                    <td className="py-2 pr-3 font-semibold text-white">{t.symbol}</td>
                    <td className="py-2 pr-3 text-white/60">{t.type}</td>
                    <td className="py-2 pr-3 text-white/70">{t.currency}{t.entryPrice.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-white/70">
                      {t.exitPrice != null ? `${t.currency}${t.exitPrice.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-2 pr-3 text-white/70">{t.quantity}</td>
                    <td className={cn("py-2 pr-3", win ? "text-profit" : "text-loss")}>
                      {win ? "+" : ""}{t.currency}{(t.pnl ?? 0).toFixed(2)}
                      <span className="ml-1 text-[10px] opacity-70">({(t.pnlPercent ?? 0).toFixed(1)}%)</span>
                    </td>
                    <td className="py-2 pr-3 text-white/50">
                      {t.exitTime ? formatDistanceStrict(t.entryTime, t.exitTime) : "—"}
                    </td>
                    <td className="py-2 pr-3 text-white/50">{t.pattern ?? "—"}</td>
                    <td className="py-2 font-sans text-white/60">
                      {t.source === "auto" ? "🤖 Auto" : "Manual"}
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
