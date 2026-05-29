"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, TrendingUp, TrendingDown, Target, ShieldAlert, Clock } from "lucide-react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { usePortfolioStore } from "@/lib/store/portfolioStore";
import { getHistoryClient, getQuoteClient } from "@/lib/api/client";
import { Sparkline } from "@/components/shared/Sparkline";
import { SignalBadge } from "@/components/shared/SignalBadge";
import { cn, currencyForSymbol, flagForExchange, formatPercent } from "@/lib/utils";
import type { StockQuote } from "@/lib/types";

export function PositionDetailModal({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const holding = usePortfolioStore((s) => s.holdings.find((h) => h.symbol === symbol));
  const trades = usePortfolioStore((s) => s.trades.filter((t) => t.symbol === symbol));
  const closePosition = usePortfolioStore((s) => s.closePosition);

  const [spark, setSpark] = useState<number[]>([]);
  const [liveQuote, setLiveQuote] = useState<StockQuote | null>(null);

  const cur = currencyForSymbol(symbol);
  const company = holding?.companyName || trades[0]?.companyName || symbol;
  const exchange = holding?.exchange || trades[0]?.exchange || "";

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [hist, q] = await Promise.all([
          getHistoryClient(symbol, "3m", "1d").catch(() => []),
          getQuoteClient(symbol).catch(() => null),
        ]);
        if (!active) return;
        setSpark(hist.map((c) => c.close));
        if (q) setLiveQuote(q);
      } catch {
        /* best effort */
      }
    })();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      active = false;
      document.removeEventListener("keydown", onKey);
    };
  }, [symbol, onClose]);

  const currentPrice = liveQuote?.price ?? holding?.currentPrice ?? trades[0]?.exitPrice ?? trades[0]?.entryPrice ?? 0;

  // Open-position economics
  const qty = holding?.quantity ?? 0;
  const avgEntry = holding?.avgEntry ?? 0;
  const marketValue = currentPrice * qty;
  const costBasis = avgEntry * qty;
  const unrealized = marketValue - costBasis;
  const unrealizedPct = costBasis > 0 ? (unrealized / costBasis) * 100 : 0;
  const up = unrealized >= 0;

  // Realized P&L from closed trades for this symbol
  const realized = trades
    .filter((t) => t.status !== "OPEN" && t.pnl != null)
    .reduce((acc, t) => acc + (t.pnl ?? 0), 0);

  const dayUp = (liveQuote?.changePercent ?? 0) >= 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/5 bg-bg-secondary/80 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{flagForExchange(exchange, symbol)}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-white">
                    {symbol.replace(".NS", "").replace(".BO", "")}
                  </h2>
                  {exchange && (
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">{exchange}</span>
                  )}
                  {holding && (
                    <span className="rounded-full bg-profit/10 px-2 py-0.5 text-[10px] font-semibold text-profit">OPEN</span>
                  )}
                </div>
                <p className="text-xs text-white/50">{company}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 p-5">
            {/* Price + sparkline */}
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="font-mono-data text-3xl font-bold text-white">
                  {cur}
                  {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {liveQuote && (
                  <div className={cn("flex items-center gap-1 text-sm font-medium", dayUp ? "text-profit" : "text-loss")}>
                    {dayUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {formatPercent(liveQuote.changePercent)} today
                  </div>
                )}
              </div>
              <div className="w-1/2 max-w-[280px]">
                <Sparkline values={spark} up={dayUp} />
                <div className="mt-1 text-right text-[10px] text-white/35">3-month trend</div>
              </div>
            </div>

            {/* Open position economics */}
            {holding ? (
              <>
                <div className={cn("rounded-2xl border p-4", up ? "border-profit/30 bg-profit/5" : "border-loss/30 bg-loss/5")}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wide text-white/45">Unrealised P&L</span>
                    <span className="text-[11px] text-white/45">{qty} shares @ avg {cur}{avgEntry.toFixed(2)}</span>
                  </div>
                  <div className={cn("mt-1 font-mono-data text-3xl font-bold", up ? "text-profit" : "text-loss")}>
                    {up ? "+" : ""}{cur}{unrealized.toFixed(2)}
                    <span className="ml-2 text-lg">({up ? "+" : ""}{unrealizedPct.toFixed(2)}%)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Detail label="Quantity" value={String(qty)} />
                  <Detail label="Avg Entry" value={`${cur}${avgEntry.toFixed(2)}`} />
                  <Detail label="Current" value={`${cur}${currentPrice.toFixed(2)}`} />
                  <Detail label="Cost Basis" value={`${cur}${costBasis.toFixed(2)}`} />
                  <Detail label="Market Value" value={`${cur}${marketValue.toFixed(2)}`} highlight />
                  <Detail label="You'd receive" value={`${cur}${marketValue.toFixed(2)}`} tone={up ? "good" : "bad"} />
                  {holding.targetPrice ? (
                    <Detail label="Target" value={`${cur}${holding.targetPrice.toFixed(2)}`} icon={<Target className="h-3 w-3" />} tone="good" />
                  ) : null}
                  {holding.stopLoss ? (
                    <Detail label="Stop Loss" value={`${cur}${holding.stopLoss.toFixed(2)}`} icon={<ShieldAlert className="h-3 w-3" />} tone="bad" />
                  ) : null}
                  <Detail label="Source" value={holding.source === "auto" ? "🤖 Auto agent" : "Manual"} />
                  <Detail label="Opened" value={formatDistanceToNowStrict(holding.openedAt, { addSuffix: true })} />
                  {holding.aiSignal ? (
                    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                      <span className="text-[10px] uppercase tracking-wide text-white/40">AI Signal</span>
                      <SignalBadge signal={holding.aiSignal} size="sm" animate={false} />
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      closePosition(symbol, currentPrice);
                      toast.success(`Closed ${symbol} for ${up ? "+" : ""}${cur}${unrealized.toFixed(2)}`);
                      onClose();
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-gold-primary to-gold-accent py-2.5 text-center font-semibold text-bg-primary transition hover:shadow-gold-glow"
                  >
                    Close position · {cur}{marketValue.toFixed(2)}
                  </button>
                  <Link
                    href={`/trading?symbol=${encodeURIComponent(symbol)}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-gold-primary/25 px-4 py-2.5 text-sm font-semibold text-gold-primary transition hover:bg-gold-primary/10"
                  >
                    Analyse <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center text-sm text-white/50">
                No open position — see the trade history below.
              </div>
            )}

            {/* Trade history for this symbol */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-white">Trade history · {symbol.replace(".NS", "")}</h3>
                {realized !== 0 && (
                  <span className={cn("font-mono-data text-sm font-bold", realized >= 0 ? "text-profit" : "text-loss")}>
                    Realised {realized >= 0 ? "+" : ""}{cur}{realized.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {trades.length === 0 && <div className="text-xs text-white/35">No trades recorded.</div>}
                {trades.map((t) => {
                  const win = (t.pnl ?? 0) >= 0;
                  return (
                    <div key={t.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                            t.status === "OPEN" ? "bg-info/15 text-info"
                            : t.status === "TARGET_HIT" ? "bg-profit/15 text-profit"
                            : t.status === "STOP_HIT" ? "bg-loss/15 text-loss"
                            : "bg-white/10 text-white/60"
                          )}>
                            {t.status.replace("_", " ")}
                          </span>
                          <span className="text-xs text-white/50">{t.source === "auto" ? "🤖 Auto" : "Manual"}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-white/35">
                          <Clock className="h-3 w-3" />
                          {format(t.entryTime, "dd MMM, HH:mm")}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 font-mono-data text-xs">
                        <span className="text-white/60">Entry {cur}{t.entryPrice.toFixed(2)}</span>
                        <span className="text-white/60">Exit {t.exitPrice != null ? `${cur}${t.exitPrice.toFixed(2)}` : "—"}</span>
                        <span className="text-white/60">Qty {t.quantity}</span>
                      </div>
                      {t.status !== "OPEN" && t.pnl != null && (
                        <div className={cn("mt-1 font-mono-data text-sm font-bold", win ? "text-profit" : "text-loss")}>
                          {win ? "+" : ""}{cur}{t.pnl.toFixed(2)} ({(t.pnlPercent ?? 0).toFixed(1)}%)
                          {t.exitTime && (
                            <span className="ml-2 text-[10px] font-normal text-white/35">
                              held {formatDistanceToNowStrict(t.entryTime, { addSuffix: false })}
                            </span>
                          )}
                        </div>
                      )}
                      {(t.pattern || t.aiConfidence != null) && (
                        <div className="mt-1 text-[10px] text-white/40">
                          {t.pattern ? `Pattern: ${t.pattern}` : ""}
                          {t.aiConfidence != null ? `${t.pattern ? " · " : ""}AI confidence ${t.aiConfidence}%` : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Detail({
  label,
  value,
  icon,
  tone,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "good" | "bad";
  highlight?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border px-3 py-2", highlight ? "border-gold-primary/25 bg-gold-primary/5" : "border-white/5 bg-white/[0.02]")}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/40">
        {icon}
        {label}
      </div>
      <div className={cn(
        "font-mono-data text-sm font-semibold",
        tone === "good" ? "text-profit" : tone === "bad" ? "text-loss" : "text-white/90"
      )}>
        {value}
      </div>
    </div>
  );
}
