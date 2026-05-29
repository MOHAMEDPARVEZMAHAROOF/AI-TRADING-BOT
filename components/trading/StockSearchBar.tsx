"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchSymbolsClient } from "@/lib/api/client";
import type { SearchResult } from "@/lib/types";
import { POPULAR_SYMBOLS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StockSearchBar({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchSymbolsClient(query);
        setResults(res);
        setHighlight(0);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [query]);

  const choose = (symbol: string) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelect(symbol.toUpperCase());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[highlight]) choose(results[highlight].symbol);
      else if (query.trim()) choose(query.trim());
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="glass-card flex items-center gap-3 px-4 py-3">
        <Search className="h-5 w-5 shrink-0 text-gold-primary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => query && setOpen(true)}
          placeholder="Search any stock — AAPL, TSLA, RELIANCE.NS, TCS.NS..."
          className="w-full bg-transparent text-base text-white placeholder:text-white/35 focus:outline-none"
        />
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold-primary" />}
      </div>

      {!query && (
        <div className="mt-2 flex flex-wrap gap-2">
          {POPULAR_SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => choose(s)}
              className="rounded-full border border-gold-primary/20 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-gold-primary/50 hover:text-gold-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="glass-card absolute z-50 mt-2 max-h-80 w-full overflow-y-auto p-1.5">
          {loading && results.length === 0 && (
            <div className="space-y-2 p-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="shimmer h-10 rounded-lg" />
              ))}
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-4 text-center text-sm text-white/45">
              No matches. Press Enter to try “{query}” directly.
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.symbol}-${i}`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => choose(r.symbol)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition",
                highlight === i ? "bg-gold-primary/10" : "hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">{r.flag}</span>
                <div className="min-w-0">
                  <div className="font-mono-data text-sm font-semibold text-white">{r.symbol}</div>
                  <div className="truncate text-xs text-white/50">{r.shortname}</div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-white/60">{r.exchDisp}</div>
                <div className="text-[10px] text-white/35">{r.typeDisp}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
