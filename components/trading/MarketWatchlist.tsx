"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Search } from "lucide-react";
import type { StockQuote } from "@/lib/types";
import { getMarketQuotes } from "@/lib/api/client";
import { MARKETS_INDIA, MARKETS_US, MARKETS_WATCHLIST } from "@/lib/constants";
import { cn, currencyForSymbol, flagForExchange, formatPercent } from "@/lib/utils";

type Tab = "all" | "us" | "india" | "gainers" | "losers";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All Markets" },
  { id: "us", label: "🇺🇸 International" },
  { id: "india", label: "🇮🇳 India" },
  { id: "gainers", label: "Top Gainers" },
  { id: "losers", label: "Top Losers" },
];

export function MarketWatchlist({
  onSelect,
  activeSymbol,
  compact,
}: {
  onSelect: (symbol: string) => void;
  activeSymbol?: string | null;
  compact?: boolean;
}) {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const list = tab === "us" ? MARKETS_US : tab === "india" ? MARKETS_INDIA : MARKETS_WATCHLIST;
    const data = await getMarketQuotes(list);
    if (!mounted.current) return;
    if (data.length) {
      setQuotes((prev) => mergeQuotes(prev, data));
      setUpdatedAt(Date.now());
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    load();
    const id = setInterval(load, 15_000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [load]);

  let display = [...quotes];
  if (tab === "gainers") display.sort((a, b) => b.changePercent - a.changePercent);
  else if (tab === "losers") display.sort((a, b) => a.changePercent - b.changePercent);

  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base font-semibold text-white">Equity Markets</h3>
          <span className="flex items-center gap-1 rounded-full bg-profit/10 px-2 py-0.5 text-[10px] font-semibold text-profit">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-profit" /> LIVE
          </span>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-1 text-[11px] text-white/40 transition hover:text-gold-primary"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          {updatedAt ? new Date(updatedAt).toLocaleTimeString() : "…"}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] transition",
              tab === t.id ? "bg-gold-primary/15 text-gold-primary" : "text-white/45 hover:bg-white/5"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && quotes.length === 0 ? (
        <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4")}>
          {Array.from({ length: compact ? 6 : 12 }).map((_, i) => (
            <div key={i} className="shimmer h-[68px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-2",
            compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
          )}
        >
          {display.map((q) => {
            const up = q.changePercent >= 0;
            const cur = currencyForSymbol(q.symbol);
            const active = activeSymbol === q.symbol;
            return (
              <button
                key={q.symbol}
                onClick={() => onSelect(q.symbol)}
                className={cn(
                  "group flex flex-col gap-1 rounded-xl border bg-white/[0.02] p-3 text-left transition hover:border-gold-primary/40 hover:bg-white/[0.04]",
                  active ? "border-gold-primary/50 bg-gold-primary/5" : "border-white/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono-data text-sm font-bold text-white">
                    <span className="text-xs">{flagForExchange(q.exchange, q.symbol)}</span>
                    {q.symbol.replace(".NS", "").replace(".BO", "")}
                  </span>
                  {up ? (
                    <TrendingUp className="h-3.5 w-3.5 text-profit" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-loss" />
                  )}
                </div>
                <div className="truncate text-[10px] text-white/40">{q.shortName}</div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono-data text-sm text-white/90">
                    {cur}
                    {q.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={cn("font-mono-data text-xs font-semibold", up ? "text-profit" : "text-loss")}>
                    {formatPercent(q.changePercent)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!loading && quotes.length === 0 && (
        <div className="flex h-24 items-center justify-center gap-2 text-sm text-white/40">
          <Search className="h-4 w-4" /> Market data unavailable right now — try refreshing.
        </div>
      )}
    </div>
  );
}

function mergeQuotes(prev: StockQuote[], next: StockQuote[]): StockQuote[] {
  const map = new Map(prev.map((q) => [q.symbol, q]));
  for (const q of next) map.set(q.symbol, q);
  // Keep only symbols present in the latest fetch to respect tab filtering.
  const nextSymbols = new Set(next.map((q) => q.symbol));
  return Array.from(map.values()).filter((q) => nextSymbols.has(q.symbol));
}
