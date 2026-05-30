"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { RefreshCw, RotateCcw } from "lucide-react";
import { PortfolioSummary } from "@/components/portfolio/PortfolioSummary";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { TradeHistoryTable } from "@/components/portfolio/TradeHistoryTable";
import { AllocationDonut } from "@/components/portfolio/AllocationDonut";
import { NotificationsPanel } from "@/components/portfolio/NotificationsPanel";
import { PositionDetailModal } from "@/components/portfolio/PositionDetailModal";
import { usePortfolioStore } from "@/lib/store/portfolioStore";
import { getMarketQuotes } from "@/lib/api/client";
import { useHydrated } from "@/lib/hooks/useHydrated";

const PnLChart = dynamic(() => import("@/components/portfolio/PnLChart").then((m) => m.PnLChart), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full rounded-lg" />,
});

export default function PortfolioPage() {
  const hydrated = useHydrated();
  const store = usePortfolioStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const holdings = store.holdings;
  const trades = store.trades;
  const notifications = store.notifications;

  const refreshPrices = useCallback(async () => {
    const symbols = usePortfolioStore.getState().holdings.map((h) => h.symbol);
    if (!symbols.length) return;
    setRefreshing(true);
    try {
      const quotes = await getMarketQuotes(symbols);
      const prices: Record<string, number> = {};
      for (const q of quotes) prices[q.symbol] = q.price;
      usePortfolioStore.getState().updatePrices(prices);
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    refreshPrices();
    const id = setInterval(refreshPrices, 30_000);
    return () => clearInterval(id);
  }, [hydrated, refreshPrices]);

  const totalValue = store.getTotalValue();
  const totalPnLPercent = store.getTotalPnLPercent();
  const winRate = store.getWinRate();
  const todayPnL = computeTodayPnL(store.valueHistory, totalValue);

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div className="flex items-center justify-between">
        <div className="rounded-xl border border-gold-primary/15 bg-gold-primary/5 px-4 py-2 text-xs text-gold-primary">
          Paper portfolio · $100,000 virtual starting capital.
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshPrices}
            className="flex items-center gap-1.5 rounded-lg border border-gold-primary/20 px-3 py-1.5 text-xs text-gold-primary transition hover:bg-gold-primary/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => {
              if (confirm("Reset your portfolio? This clears all holdings and history.")) {
                store.reset();
                toast.success("Portfolio reset to $100,000");
              }
            }}
            className="flex items-center gap-1.5 rounded-lg border border-loss/30 px-3 py-1.5 text-xs text-loss transition hover:bg-loss/10"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {hydrated ? (
        <PortfolioSummary
          totalValue={totalValue}
          todayPnL={todayPnL}
          totalPnLPercent={totalPnLPercent}
          winRate={winRate}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-24 rounded-2xl" />
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass-card p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-white">Portfolio Value</h3>
          <div className="h-[280px]">{hydrated && <PnLChart data={store.valueHistory} />}</div>
        </div>
        <div className="glass-card p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-white">Asset Allocation</h3>
          {hydrated && <AllocationDonut holdings={holdings} cash={store.balance} />}
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-white">Holdings</h3>
          <span className="text-[11px] text-white/40">Tap a position for full details</span>
        </div>
        {hydrated && <HoldingsTable holdings={holdings} onSelect={setSelected} />}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="glass-card p-4">{hydrated && <TradeHistoryTable trades={trades} onSelect={setSelected} />}</div>
        <div className="glass-card p-4">{hydrated && <NotificationsPanel notifications={notifications} />}</div>
      </div>

      {selected && <PositionDetailModal symbol={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function computeTodayPnL(history: { time: number; value: number }[], current: number): number {
  if (!history.length) return 0;
  const dayAgo = Math.floor(Date.now() / 1000) - 24 * 3600;
  const baseline = history.find((h) => h.time >= dayAgo) ?? history[0];
  return current - baseline.value;
}
