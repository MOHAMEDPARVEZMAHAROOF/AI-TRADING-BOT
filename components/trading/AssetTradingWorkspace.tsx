"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LiveTradeBotPanel } from "@/components/bots/LiveTradeBotPanel";
import { AssetMarketWatchlist } from "@/components/trading/AssetMarketWatchlist";
import { StockSearchBar } from "@/components/trading/StockSearchBar";
import { AIAnalysisPanel } from "@/components/trading/AIAnalysisPanel";
import { OrderPanel } from "@/components/trading/OrderPanel";
import { TechnicalIndicators } from "@/components/trading/TechnicalIndicators";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useTradingStore } from "@/lib/store/tradingStore";
import { getHistoryClient, getQuoteClient, streamAnalysis } from "@/lib/api/client";
import { computeIndicatorSnapshot } from "@/lib/analysis/snapshot";
import { detectPatterns } from "@/lib/analysis/patternRecognition";
import type { ChartType } from "@/components/trading/StockChart";
import type { LiveBotMarket } from "@/lib/types";
import { cn, currencyForSymbol, displaySymbol, formatCompact, formatPercent, formatPrice } from "@/lib/utils";

const StockChart = dynamic(
  () => import("@/components/trading/StockChart").then((m) => m.StockChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const RANGES = ["1d", "5d", "1m", "3m", "6m"];
const RANGE_INTERVAL: Record<string, string> = {
  "1d": "5m",
  "5d": "15m",
  "1m": "1d",
  "3m": "1d",
  "6m": "1d",
};

export function AssetTradingWorkspace({
  market,
  title,
  subtitle,
  watchlist,
  defaultSymbol,
}: {
  market: LiveBotMarket;
  title: string;
  subtitle: string;
  watchlist: string[];
  defaultSymbol?: string;
}) {
  const s = useTradingStore();
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [rawStream, setRawStream] = useState("");
  const [source, setSource] = useState("groq");
  const [lastTick, setLastTick] = useState<number | null>(null);
  const analysisToken = useRef(0);

  const loadHistory = useCallback(async (symbol: string, range: string) => {
    s.setLoadingChart(true);
    try {
      const candles = await getHistoryClient(symbol, range, RANGE_INTERVAL[range] ?? "1d");
      s.setCandles(candles);
      if (candles.length > 5) {
        s.setIndicators(computeIndicatorSnapshot(candles));
        s.setPatterns(detectPatterns(candles));
      }
    } catch (err) {
      toast.error((err as Error).message || "Failed to load chart");
    } finally {
      s.setLoadingChart(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAnalysis = useCallback(async (symbol: string) => {
    const token = ++analysisToken.current;
    s.setAnalysing(true);
    s.setAnalysisError(null);
    s.setSignal(null);
    setRawStream("");
    try {
      const { signal, source: src } = await streamAnalysis(symbol, (acc) => {
        if (token === analysisToken.current) setRawStream(acc);
      });
      if (token !== analysisToken.current) return;
      setSource(src);
      if (signal) s.setSignal(signal);
      else s.setAnalysisError("AI response could not be parsed. Try re-running.");
    } catch (err) {
      if (token === analysisToken.current)
        s.setAnalysisError((err as Error).message || "AI analysis failed");
    } finally {
      if (token === analysisToken.current) s.setAnalysing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectStock = useCallback(
    async (symbol: string) => {
      s.setSymbol(symbol);
      s.resetAnalysis();
      s.setSignal(null);
      s.setLoadingQuote(true);
      try {
        const quote = await getQuoteClient(symbol);
        s.setQuote(quote);
        setLastTick(Date.now());
      } catch {
        toast.error(`Couldn't load ${displaySymbol(symbol)}`);
        s.setQuote(null);
        s.setLoadingQuote(false);
        return;
      }
      s.setLoadingQuote(false);
      await loadHistory(symbol, s.range);
      runAnalysis(symbol);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.range]
  );

  const changeRange = (range: string) => {
    s.setRange(range);
    if (s.symbol) loadHistory(s.symbol, range);
  };

  useEffect(() => {
    if (!s.symbol) return;
    const id = setInterval(async () => {
      try {
        const quote = await getQuoteClient(s.symbol!);
        s.setQuote(quote);
        setLastTick(Date.now());
      } catch {
        /* ignore */
      }
    }, 12_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.symbol]);

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const params = new URLSearchParams(window.location.search);
    const sym = params.get("symbol") ?? defaultSymbol;
    if (sym) selectStock(sym.toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quote = s.quote;
  const up = (quote?.changePercent ?? 0) >= 0;
  const currency = currencyForSymbol(s.symbol ?? undefined);

  return (
    <div className="mx-auto max-w-[1700px] space-y-5">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{title}</h1>
        <p className="max-w-3xl text-sm text-white/50">{subtitle}</p>
      </header>

      <LiveTradeBotPanel market={market} />

      <StockSearchBar onSelect={selectStock} />

      {!s.symbol ? (
        <AssetMarketWatchlist
          title={market === "crypto" ? "Crypto Markets" : "Forex Pairs"}
          subtitle="Live quotes · click to analyse"
          symbols={watchlist}
          onSelect={selectStock}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div className="glass-card p-4">
              {s.loadingQuote && !quote ? (
                <div className="flex items-center gap-3">
                  <LoadingSpinner /> <span className="text-white/50">Loading…</span>
                </div>
              ) : quote ? (
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-2xl font-bold text-white">
                        {displaySymbol(quote.symbol)}
                      </h2>
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                        {quote.exchange || market.toUpperCase()}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-profit/10 px-2 py-0.5 text-[10px] font-semibold text-profit">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-profit" /> LIVE
                      </span>
                    </div>
                    <p className="text-sm text-white/55">{quote.longName || quote.shortName}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-data text-3xl font-bold text-white">
                      {formatPrice(quote.price, currency)}
                    </div>
                    <div
                      className={cn(
                        "flex items-center justify-end gap-1 text-sm font-medium",
                        up ? "text-profit" : "text-loss"
                      )}
                    >
                      {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {formatPrice(Math.abs(quote.change), currency)} (
                      {formatPercent(quote.changePercent)})
                    </div>
                    {lastTick && (
                      <div className="text-[10px] text-white/35">
                        Updated {new Date(lastTick).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="glass-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1">
                  {(["candlestick", "line", "area"] as ChartType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setChartType(t)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs capitalize transition",
                        chartType === t ? "bg-gold-primary/15 text-gold-primary" : "text-white/55 hover:bg-white/5"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {RANGES.map((r) => (
                    <button
                      key={r}
                      onClick={() => changeRange(r)}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-xs uppercase transition",
                        s.range === r ? "bg-gold-primary/15 text-gold-primary" : "text-white/55 hover:bg-white/5"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[520px]">
                {s.loadingChart && s.candles.length === 0 ? (
                  <ChartSkeleton />
                ) : s.candles.length > 0 ? (
                  <StockChart
                    candles={s.candles}
                    chartType={chartType}
                    signal={s.signal}
                    patterns={s.patterns}
                    livePrice={quote?.price}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/40">
                    No chart data available.
                  </div>
                )}
              </div>
            </div>

            {s.indicators && (
              <div className="glass-card p-4">
                <h3 className="mb-3 font-display text-base font-semibold text-white">
                  Technical Indicators
                </h3>
                <TechnicalIndicators indicators={s.indicators} />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <AIAnalysisPanel
              quote={quote}
              analysing={s.analysing}
              rawStream={rawStream}
              signal={s.signal}
              source={source}
              error={s.analysisError}
              onRetry={() => s.symbol && runAnalysis(s.symbol)}
              onExecute={() => {
                document.getElementById("order-panel")?.scrollIntoView({ behavior: "smooth" });
              }}
            />
            {quote && (
              <div id="order-panel">
                <OrderPanel quote={quote} signal={s.signal} />
              </div>
            )}
          </div>
        </div>
      )}

      {s.symbol && (
        <AssetMarketWatchlist
          title="Switch instrument"
          symbols={watchlist}
          onSelect={selectStock}
          activeSymbol={s.symbol}
          compact
        />
      )}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="shimmer flex-1 rounded-lg" />
      <div className="shimmer h-[100px] rounded-lg" />
    </div>
  );
}
