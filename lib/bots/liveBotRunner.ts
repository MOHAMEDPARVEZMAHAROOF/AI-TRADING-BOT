import "server-only";
import { getHistory, getQuotesBatch } from "@/lib/api/yahooFinance";
import { computeIndicatorSnapshot, scoreSnapshot } from "@/lib/analysis/snapshot";
import {
  CRYPTO_WATCHLIST,
  FOREX_WATCHLIST,
  RISK_CRYPTO,
  RISK_FOREX,
} from "@/lib/constants";
import { canLiveBotRun } from "@/lib/market/marketHours";
import type { LiveBotMarket } from "@/lib/types";

const BATCH = 10;

/**
 * Server-side analysis tick — scans watchlist with agentic technical layers.
 * Paper execution happens on the client orchestrator when the app is open;
 * this tick keeps 24/7 analysis running in the cloud when the tab is closed.
 */
export async function runLiveBotTick(market: LiveBotMarket): Promise<{
  ok: boolean;
  reason?: string;
  scanned: number;
  topScore: number;
  topSymbol?: string;
}> {
  if (!canLiveBotRun(market)) {
    return {
      ok: false,
      reason: "Forex markets closed for the weekend",
      scanned: 0,
      topScore: 0,
    };
  }

  const watchlist = market === "crypto" ? CRYPTO_WATCHLIST : FOREX_WATCHLIST;
  const riskCfg = market === "crypto" ? RISK_CRYPTO : RISK_FOREX;
  const batch = watchlist.slice(0, BATCH);

  const quotes = await getQuotesBatch(batch);
  let topScore = 0;
  let topSymbol: string | undefined;

  for (const q of quotes) {
    let score = 50;
    try {
      const candles = await getHistory(q.symbol, "1m", "1d");
      if (candles.length > 30) {
        const snap = computeIndicatorSnapshot(candles);
        const res = scoreSnapshot(snap, q.price, q.changePercent);
        score = res.score;
      }
    } catch {
      /* quote-only */
    }
    if (score > topScore) {
      topScore = score;
      topSymbol = q.symbol;
    }
  }

  const flagged = topScore >= riskCfg.minTechnicalScore;
  return {
    ok: true,
    scanned: quotes.length,
    topScore,
    topSymbol: flagged ? topSymbol : undefined,
  };
}
