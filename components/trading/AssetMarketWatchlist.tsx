"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import type { StockQuote } from "@/lib/types";
import { getMarketQuotes } from "@/lib/api/client";
import { cn, currencyForSymbol, displaySymbol, flagForExchange, formatPercent } from "@/lib/utils";

export function AssetMarketWatchlist({
  title,
  subtitle,
  symbols,
  onSelect,
  activeSymbol,
  compact,
}: {
  title: string;
  subtitle?: string;
  symbols: string[];
  onSelect: (symbol: string) => void;
  activeSymbol?: string | null;
  compact?: boolean;
}) {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const data = await getMarketQuotes(symbols);
    if (!mounted.current) return;
    if (data.length) {
      setQuotes(data);
      setUpdatedAt(Date.now());
    }
    setLoading(false);
  }, [symbols]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    load();
    const id = setInterval(load, 12_000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [load]);

  return (
    <div className="glass-card p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-white/45">{subtitle}</p>}
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-1 text-[11px] text-white/40 transition hover:text-gold-primary"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          {updatedAt ? new Date(updatedAt).toLocaleTimeString() : "…"}
        </button>
      </div>

      {loading && quotes.length === 0 ? (
        <div
          className={cn(
            "grid gap-2",
            compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
          )}
        >
          {Array.from({ length: compact ? 6 : 10 }).map((_, i) => (
            <div key={i} className="shimmer h-[72px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-2",
            compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
          )}
        >
          {quotes.map((q) => {
            const up = q.changePercent >= 0;
            const cur = currencyForSymbol(q.symbol);
            const active = activeSymbol === q.symbol;
            return (
              <button
                key={q.symbol}
                onClick={() => onSelect(q.symbol)}
                className={cn(
                  "group flex flex-col gap-1 rounded-xl border bg-white/[0.02] p-3 text-left transition hover:border-gold-primary/40 hover:bg-white/[0.04]",
                  active ? "border-gold-primary/50 bg-gold-primary/5 ring-1 ring-gold-primary/20" : "border-white/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono-data text-sm font-bold text-white">
                    <span className="text-xs">{flagForExchange(q.exchange, q.symbol)}</span>
                    {displaySymbol(q.symbol)}
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
                    {q.price.toLocaleString(undefined, {
                      minimumFractionDigits: q.price < 10 ? 4 : 2,
                      maximumFractionDigits: q.price < 10 ? 4 : 2,
                    })}
                  </span>
                  <span
                    className={cn(
                      "font-mono-data text-xs font-semibold",
                      up ? "text-profit" : "text-loss"
                    )}
                  >
                    {formatPercent(q.changePercent)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
