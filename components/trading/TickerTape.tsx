"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { StockQuote } from "@/lib/types";
import { getMarketQuotes } from "@/lib/api/client";
import { cn, formatPercent } from "@/lib/utils";

const INDICES = ["^GSPC", "^IXIC", "^DJI", "^NSEI", "^BSESN"];
const LABELS: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^IXIC": "NASDAQ",
  "^DJI": "DOW",
  "^NSEI": "NIFTY 50",
  "^BSESN": "SENSEX",
};

export function TickerTape() {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await getMarketQuotes(INDICES);
      if (active && data.length) setQuotes(data);
    };
    load();
    const id = setInterval(load, 20_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (quotes.length === 0) return null;

  // Duplicate the list so the marquee scrolls seamlessly.
  const items = [...quotes, ...quotes];

  return (
    <div className="glass-card group relative overflow-hidden">
      <div className="flex w-max animate-[ticker_38s_linear_infinite] gap-8 px-4 py-2.5 group-hover:[animation-play-state:paused]">
        {items.map((q, i) => {
          const up = q.changePercent >= 0;
          return (
            <div key={`${q.symbol}-${i}`} className="flex shrink-0 items-center gap-2 text-sm">
              <span className="font-semibold text-white/80">{LABELS[q.symbol] ?? q.symbol}</span>
              <span className="font-mono-data text-white/90">
                {q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className={cn("flex items-center gap-0.5 font-mono-data text-xs", up ? "text-profit" : "text-loss")}>
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(q.changePercent)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
