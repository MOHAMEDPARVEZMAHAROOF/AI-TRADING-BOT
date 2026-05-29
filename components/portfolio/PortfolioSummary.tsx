"use client";

import { Wallet, TrendingUp, Percent, Trophy } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { cn } from "@/lib/utils";

export function PortfolioSummary({
  totalValue,
  todayPnL,
  totalPnLPercent,
  winRate,
}: {
  totalValue: number;
  todayPnL: number;
  totalPnLPercent: number;
  winRate: number;
}) {
  const cards = [
    {
      label: "Total Portfolio Value",
      icon: Wallet,
      node: <AnimatedNumber value={totalValue} prefix="$" />,
      tone: "neutral" as const,
    },
    {
      label: "Today's P&L",
      icon: TrendingUp,
      node: <AnimatedNumber value={todayPnL} prefix={todayPnL >= 0 ? "+$" : "-$"} />,
      tone: todayPnL >= 0 ? ("good" as const) : ("bad" as const),
      raw: todayPnL,
    },
    {
      label: "Total P&L %",
      icon: Percent,
      node: <AnimatedNumber value={totalPnLPercent} suffix="%" decimals={1} prefix={totalPnLPercent >= 0 ? "+" : ""} />,
      tone: totalPnLPercent >= 0 ? ("good" as const) : ("bad" as const),
    },
    {
      label: "Win Rate",
      icon: Trophy,
      node: <AnimatedNumber value={winRate} suffix="%" decimals={0} />,
      tone: "gold" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const value = "raw" in c ? Math.abs(c.raw as number) : 0;
        return (
          <GlassCard key={c.label} hover className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-primary/10">
                <Icon className="h-4 w-4 text-gold-primary" />
              </div>
              <span className="text-[11px] uppercase tracking-wide text-white/40">{c.label}</span>
            </div>
            <div
              className={cn(
                "text-2xl font-bold",
                c.tone === "good" && "text-profit",
                c.tone === "bad" && "text-loss",
                c.tone === "gold" && "text-gold-primary",
                c.tone === "neutral" && "text-white"
              )}
            >
              {"raw" in c ? (
                <span className="font-mono-data">
                  {(c.raw as number) >= 0 ? "+$" : "-$"}
                  {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              ) : (
                c.node
              )}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
