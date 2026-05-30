"use client";

import { usePathname } from "next/navigation";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { usePortfolioStore } from "@/lib/store/portfolioStore";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { formatPrice, formatPercent, cn } from "@/lib/utils";
import { MarketStatusChips } from "@/components/markets/MarketStatusChips";
import { UserMenu } from "./UserMenu";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/trading": { title: "Equities Desk", subtitle: "US & Indian markets · live AI analysis" },
  "/crypto": { title: "Crypto Desk", subtitle: "24/7 digital assets · cloud live bot" },
  "/forex": { title: "Forex Desk", subtitle: "24/5 major pairs · session-aware bot" },
  "/autonomous": { title: "Autonomous AI Trader", subtitle: "Multi-agent equity network" },
  "/portfolio": { title: "Portfolio", subtitle: "Holdings, performance & trade history" },
};

export function TopBar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname() ?? "/trading";
  const hydrated = useHydrated();
  const key = Object.keys(TITLES).find((k) => pathname.startsWith(k)) ?? "/trading";
  const meta = TITLES[key];

  const totalValue = usePortfolioStore((s) => s.getTotalValue());
  const pnl = usePortfolioStore((s) => s.getTotalPnL());
  const pnlPct = usePortfolioStore((s) => s.getTotalPnLPercent());
  const up = pnl >= 0;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gold-primary/10 bg-bg-primary/60 px-5 py-3.5 backdrop-blur-xl">
      <div className="pl-10 lg:pl-0">
        <h1 className="font-display text-lg font-bold text-white md:text-xl">{meta.title}</h1>
        <p className="hidden text-xs text-white/45 sm:block">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <MarketStatusChips />
        <div className="glass-card hidden items-center gap-3 px-4 py-2 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-primary/10">
            <Wallet className="h-4 w-4 text-gold-primary" />
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-white/40">Portfolio Value</div>
            <div className="font-mono-data text-base font-semibold text-white">
              {hydrated ? formatPrice(totalValue) : "—"}
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium",
              up ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
            )}
          >
            {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span className="font-mono-data">{hydrated ? formatPercent(pnlPct) : "—"}</span>
          </div>
        </div>

        <UserMenu userName={userName} userEmail={userEmail} />
      </div>
    </header>
  );
}
