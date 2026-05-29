"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Minus, Plus, Wallet } from "lucide-react";
import type { AISignal, StockQuote } from "@/lib/types";
import { usePortfolioStore } from "@/lib/store/portfolioStore";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { currencyForSymbol, formatPrice, cn } from "@/lib/utils";

export function OrderPanel({
  quote,
  signal,
}: {
  quote: StockQuote;
  signal: AISignal | null;
}) {
  const hydrated = useHydrated();
  const balance = usePortfolioStore((s) => s.balance);
  const executeBuy = usePortfolioStore((s) => s.executeBuy);
  const [qty, setQty] = useState(1);
  const currency = currencyForSymbol(quote.symbol);

  const price = quote.price;
  const cost = price * qty;
  const canAfford = cost <= balance;

  const execute = () => {
    const res = executeBuy({
      symbol: quote.symbol,
      companyName: quote.longName || quote.shortName,
      exchange: quote.exchange,
      currency,
      quantity: qty,
      price,
      targetPrice: signal?.targetPrice,
      stopLoss: signal?.stopLoss,
      aiSignal: signal?.signal,
      aiConfidence: signal?.confidence,
      pattern: signal?.patternExplanation?.split(":")[0],
      source: "manual",
    });
    if (res.ok) {
      toast.success(
        `Bought ${qty} ${quote.symbol} @ ${currency}${price.toFixed(2)}`,
        { icon: "✅" }
      );
    } else {
      toast.error(res.message);
    }
  };

  const maxAffordable = price > 0 ? Math.floor(balance / price) : 0;

  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white">Demo Order</h3>
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Wallet className="h-3.5 w-3.5 text-gold-primary" />
          {hydrated ? formatPrice(balance) : "—"}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70 transition hover:border-gold-primary/40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] text-center font-mono-data text-white focus:border-gold-primary/40 focus:outline-none"
        />
        <button
          onClick={() => setQty((q) => q + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70 transition hover:border-gold-primary/40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {[1, 5, 10, 25].map((n) => (
          <button
            key={n}
            onClick={() => setQty(n)}
            className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-white/60 transition hover:border-gold-primary/40 hover:text-gold-primary"
          >
            {n}
          </button>
        ))}
        {maxAffordable > 0 && (
          <button
            onClick={() => setQty(maxAffordable)}
            className="rounded-md border border-gold-primary/30 px-2.5 py-1 text-xs text-gold-primary transition hover:bg-gold-primary/10"
          >
            Max
          </button>
        )}
      </div>

      <div className="mb-3 space-y-1.5 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm">
        <Row label="Price" value={`${currency}${price.toFixed(2)}`} />
        <Row label="Quantity" value={String(qty)} />
        <Row label="Total Cost" value={`${currency}${cost.toFixed(2)}`} bold />
        {signal && (
          <>
            <Row label="Target" value={`${currency}${signal.targetPrice.toFixed(2)}`} tone="good" />
            <Row label="Stop Loss" value={`${currency}${signal.stopLoss.toFixed(2)}`} tone="bad" />
          </>
        )}
      </div>

      <button
        onClick={execute}
        disabled={!canAfford || !hydrated}
        className={cn(
          "w-full rounded-xl py-3 font-semibold transition",
          canAfford
            ? "bg-gradient-to-r from-profit to-emerald-400 text-bg-primary hover:shadow-[0_0_24px_rgba(0,255,136,0.3)]"
            : "cursor-not-allowed bg-white/5 text-white/40"
        )}
      >
        {canAfford ? `Buy ${qty} ${quote.symbol}` : "Insufficient Balance"}
      </button>
      <p className="mt-2 text-center text-[10px] text-white/35">DEMO MODE — not real money</p>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "good" | "bad";
}) {
  return (
    <div className="flex justify-between">
      <span className="text-white/45">{label}</span>
      <span
        className={cn(
          "font-mono-data",
          bold && "font-bold text-white",
          tone === "good" && "text-profit",
          tone === "bad" && "text-loss",
          !bold && !tone && "text-white/80"
        )}
      >
        {value}
      </span>
    </div>
  );
}
