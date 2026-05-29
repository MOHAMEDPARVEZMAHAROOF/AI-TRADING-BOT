"use client";

import type { IndicatorSnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";

function fmt(v: number, d = 2): string {
  return Number.isFinite(v) ? v.toFixed(d) : "—";
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "neutral" }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
      <div
        className={cn(
          "font-mono-data text-sm font-semibold",
          tone === "good" ? "text-profit" : tone === "bad" ? "text-loss" : "text-white"
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function TechnicalIndicators({ indicators }: { indicators: IndicatorSnapshot }) {
  const i = indicators;
  const rsiTone = i.rsi > 70 ? "bad" : i.rsi < 30 ? "good" : "neutral";
  const macdTone = i.macd > i.macdSignal ? "good" : "bad";

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Stat label="RSI (14)" value={fmt(i.rsi)} tone={rsiTone} />
      <Stat label="MACD" value={fmt(i.macd, 3)} tone={macdTone} />
      <Stat label="Signal" value={fmt(i.macdSignal, 3)} />
      <Stat label="SMA 20" value={fmt(i.sma20)} />
      <Stat label="SMA 50" value={fmt(i.sma50)} />
      <Stat label="EMA 9" value={fmt(i.ema9)} />
      <Stat label="BB Upper" value={fmt(i.bbUpper)} />
      <Stat label="BB Lower" value={fmt(i.bbLower)} />
      <Stat label="ATR (14)" value={fmt(i.atr)} />
      <Stat
        label="Volume"
        value={i.volume.trend}
        tone={i.volume.spike ? "good" : "neutral"}
      />
      <Stat
        label="Support"
        value={i.supports.length ? fmt(i.supports[0]) : "—"}
        tone="good"
      />
      <Stat
        label="Resistance"
        value={i.resistances.length ? fmt(i.resistances[0]) : "—"}
        tone="bad"
      />
    </div>
  );
}
