import "server-only";
import yahooFinance from "yahoo-finance2";
import type { OHLCV, SearchResult, StockQuote } from "@/lib/types";
import { flagForExchange } from "@/lib/utils";

// Suppress noisy survey/validation notices from the library.
yahooFinance.suppressNotices?.(["yahooSurvey", "ripHistorical"]);

interface CacheEntry<T> {
  value: T;
  expires: number;
}
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.value as T;
  if (entry) cache.delete(key);
  return undefined;
}
function setCached<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}

export async function getQuote(symbol: string): Promise<StockQuote> {
  const key = `quote:${symbol}`;
  const cached = getCached<StockQuote>(key);
  if (cached) return cached;

  const q = await yahooFinance.quote(symbol);
  if (!q || typeof q.regularMarketPrice !== "number") {
    throw new Error(`No quote data for ${symbol}`);
  }
  const quote: StockQuote = {
    symbol: q.symbol ?? symbol,
    shortName: q.shortName ?? q.longName ?? symbol,
    longName: q.longName,
    exchange: q.fullExchangeName ?? q.exchange ?? "",
    currency: q.currency ?? "USD",
    price: q.regularMarketPrice,
    change: q.regularMarketChange ?? 0,
    changePercent: q.regularMarketChangePercent ?? 0,
    volume: q.regularMarketVolume ?? 0,
    marketCap: q.marketCap,
    dayHigh: q.regularMarketDayHigh,
    dayLow: q.regularMarketDayLow,
    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: q.fiftyTwoWeekLow,
    pe: q.trailingPE,
    eps: q.epsTrailingTwelveMonths,
  };
  setCached(key, quote, 30_000);
  return quote;
}

export async function getQuotesBatch(symbols: string[]): Promise<StockQuote[]> {
  const results = await Promise.allSettled(symbols.map((s) => getQuote(s)));
  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled")
    .map((r) => r.value);
}

const RANGE_DAYS: Record<string, number> = {
  "1d": 1,
  "5d": 5,
  "1m": 31,
  "3m": 93,
  "6m": 186,
  "1y": 372,
  "5y": 1830,
};

export async function getHistory(
  symbol: string,
  range = "6m",
  interval: "1d" | "1wk" | "1mo" | "1h" | "5m" | "15m" = "1d"
): Promise<OHLCV[]> {
  const key = `hist:${symbol}:${range}:${interval}`;
  const cached = getCached<OHLCV[]>(key);
  if (cached) return cached;

  const days = RANGE_DAYS[range] ?? 186;
  const period2 = new Date();
  const period1 = new Date();
  period1.setDate(period1.getDate() - days);

  // Use chart() which is the supported successor to historical().
  const chart = await yahooFinance.chart(symbol, {
    period1,
    period2,
    interval,
  });

  const rows = (chart.quotes ?? [])
    .filter(
      (r) =>
        r.open != null &&
        r.high != null &&
        r.low != null &&
        r.close != null
    )
    .map((r) => {
      const d = new Date(r.date);
      return {
        date: d.toISOString(),
        time: Math.floor(d.getTime() / 1000),
        open: r.open as number,
        high: r.high as number,
        low: r.low as number,
        close: r.close as number,
        volume: (r.volume as number) ?? 0,
      } satisfies OHLCV;
    });

  setCached(key, rows, 60_000);
  return rows;
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const key = `search:${query.toLowerCase()}`;
  const cached = getCached<SearchResult[]>(key);
  if (cached) return cached;

  const res = await yahooFinance.search(query, { newsCount: 0, quotesCount: 12 });
  const out: SearchResult[] = (res.quotes ?? [])
    .filter((q: any) => q.symbol && (q.isYahooFinance ?? true))
    .map((q: any) => ({
      symbol: q.symbol,
      shortname: q.shortname ?? q.longname ?? q.symbol,
      exchDisp: q.exchDisp ?? q.exchange ?? "",
      typeDisp: q.typeDisp ?? q.quoteType ?? "",
      flag: flagForExchange(q.exchDisp ?? q.exchange, q.symbol),
    }));
  setCached(key, out, 120_000);
  return out;
}
