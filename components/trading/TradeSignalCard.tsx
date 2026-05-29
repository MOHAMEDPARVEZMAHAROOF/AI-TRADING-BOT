"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Target, ShieldAlert, Clock, TrendingUp } from "lucide-react";
import type { AISignal } from "@/lib/types";
import { SignalBadge } from "@/components/shared/SignalBadge";
import { ConfidenceMeter } from "@/components/shared/ConfidenceMeter";
import { cn, clamp } from "@/lib/utils";

const RISK_TONE: Record<string, string> = {
  LOW: "text-profit",
  MEDIUM: "text-gold-primary",
  HIGH: "text-loss",
};

export function TradeSignalCard({
  signal,
  currency,
  onExecute,
}: {
  signal: AISignal;
  currency: string;
  onExecute: () => void;
}) {
  const borderGlow =
    signal.signal === "BUY"
      ? "border-profit/40 shadow-[0_0_30px_rgba(0,255,136,0.15)]"
      : signal.signal === "SELL"
      ? "border-loss/40 shadow-[0_0_30px_rgba(255,68,102,0.15)]"
      : "border-gold-primary/40 animate-pulse-gold";

  // Risk:reward visual split.
  const reward = Math.abs(signal.targetPrice - signal.entryPrice);
  const risk = Math.abs(signal.entryPrice - signal.stopLoss) || 1;
  const rewardPct = clamp((reward / (reward + risk)) * 100, 5, 95);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-card border p-5", borderGlow)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SignalBadge signal={signal.signal} size="lg" />
          <span className={cn("text-xs font-semibold", RISK_TONE[signal.riskLevel])}>
            {signal.riskLevel} RISK
          </span>
        </div>
        <ConfidenceMeter value={signal.confidence} size={88} />
      </div>

      <p className="mt-3 text-sm text-white/75">{signal.keyReason}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <PriceCell label="Entry" value={signal.entryPrice} currency={currency} icon={<TrendingUp className="h-3.5 w-3.5" />} tone="neutral" />
        <PriceCell label="Target" value={signal.targetPrice} currency={currency} icon={<Target className="h-3.5 w-3.5" />} tone="good" />
        <PriceCell label="Stop Loss" value={signal.stopLoss} currency={currency} icon={<ShieldAlert className="h-3.5 w-3.5" />} tone="bad" />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[11px] text-white/50">
          <span>Risk : Reward</span>
          <span className="font-mono-data text-gold-primary">1 : {signal.riskRewardRatio.toFixed(2)}</span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-white/5">
          <div className="h-full bg-loss/60" style={{ width: `${100 - rewardPct}%` }} />
          <div className="h-full bg-profit/70" style={{ width: `${rewardPct}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-white/55">
        <Clock className="h-3.5 w-3.5 text-gold-primary" />
        {signal.timeframe}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FactorList title="Bullish" items={signal.bullishFactors} icon={<ArrowUpRight className="h-3.5 w-3.5" />} tone="good" />
        <FactorList title="Bearish" items={signal.bearishFactors} icon={<ArrowDownRight className="h-3.5 w-3.5" />} tone="bad" />
      </div>

      {signal.patternExplanation && (
        <div className="mt-4 rounded-lg border border-gold-primary/15 bg-gold-primary/5 p-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gold-primary">Pattern</div>
          <p className="text-xs text-white/70">{signal.patternExplanation}</p>
        </div>
      )}

      <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">Suggested Action</div>
        <p className="text-xs text-white/70">{signal.suggestedAction}</p>
        {signal.marketContext && (
          <p className="mt-2 text-[11px] italic text-white/45">{signal.marketContext}</p>
        )}
      </div>

      <button
        onClick={onExecute}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-gold-primary to-gold-accent py-3 font-semibold text-bg-primary transition hover:shadow-gold-glow"
      >
        Execute Demo Trade
      </button>
    </motion.div>
  );
}

function PriceCell({
  label,
  value,
  currency,
  icon,
  tone,
}: {
  label: string;
  value: number;
  currency: string;
  icon: React.ReactNode;
  tone: "good" | "bad" | "neutral";
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
      <div className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/40">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "font-mono-data text-sm font-bold",
          tone === "good" ? "text-profit" : tone === "bad" ? "text-loss" : "text-white"
        )}
      >
        {currency}
        {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

function FactorList({
  title,
  items,
  icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  tone: "good" | "bad";
}) {
  return (
    <div>
      <div
        className={cn(
          "mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide",
          tone === "good" ? "text-profit" : "text-loss"
        )}
      >
        {icon}
        {title}
      </div>
      <ul className="space-y-1">
        {items.length === 0 && <li className="text-xs text-white/35">None</li>}
        {items.map((it, i) => (
          <li key={i} className="flex gap-1.5 text-xs text-white/70">
            <span className={tone === "good" ? "text-profit" : "text-loss"}>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
