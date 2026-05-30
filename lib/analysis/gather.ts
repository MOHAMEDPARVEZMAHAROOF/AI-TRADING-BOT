import "server-only";
import { getHistory, getQuote } from "@/lib/api/yahooFinance";
import { computeIndicatorSnapshot, scoreSnapshot } from "./snapshot";
import { detectPatterns } from "./patternRecognition";
import type { AnalysisInput } from "./aiAnalysis";

/**
 * Fetch quote + history for a symbol and compute the full analysis input bundle
 * (indicators, patterns, score). Shared by AI and agent API routes.
 */
export async function gatherAnalysis(
  symbol: string,
  range = "6m"
): Promise<AnalysisInput & { score: number; scoreReason: string }> {
  const [quote, candles] = await Promise.all([
    getQuote(symbol),
    getHistory(symbol, range, "1d"),
  ]);
  const indicators = computeIndicatorSnapshot(candles);
  const patterns = detectPatterns(candles);
  const { score, reason } = scoreSnapshot(indicators, quote.price, quote.changePercent);
  return {
    quote,
    indicators,
    patterns,
    recentOHLCV: candles,
    score,
    scoreReason: reason,
  };
}
