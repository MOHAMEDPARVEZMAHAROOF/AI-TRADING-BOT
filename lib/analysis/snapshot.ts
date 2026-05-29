import type { IndicatorSnapshot, OHLCV } from "@/lib/types";
import {
  analyzeVolume,
  calculateATR,
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
  findSupportResistance,
  lastValue,
} from "./technicalIndicators";

/**
 * Compute a full snapshot of the latest indicator values from an OHLCV series.
 */
export function computeIndicatorSnapshot(ohlcv: OHLCV[]): IndicatorSnapshot {
  const closes = ohlcv.map((o) => o.close);
  const highs = ohlcv.map((o) => o.high);
  const lows = ohlcv.map((o) => o.low);
  const volumes = ohlcv.map((o) => o.volume);

  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const ema9 = calculateEMA(closes, 9);
  const bb = calculateBollingerBands(closes);
  const atr = calculateATR(highs, lows, closes, 14);
  const { supports, resistances } = findSupportResistance(ohlcv);
  const volume = analyzeVolume(volumes, closes);

  return {
    rsi: lastValue(rsi),
    macd: lastValue(macd.macd),
    macdSignal: lastValue(macd.signal),
    macdHistogram: lastValue(macd.histogram),
    sma20: lastValue(sma20),
    sma50: lastValue(sma50),
    sma200: lastValue(sma200),
    ema9: lastValue(ema9),
    bbUpper: lastValue(bb.upper),
    bbMiddle: lastValue(bb.middle),
    bbLower: lastValue(bb.lower),
    atr: lastValue(atr),
    supports,
    resistances,
    volume,
  };
}

/**
 * Heuristic 0-100 trade-readiness score from a snapshot. Used by agents to
 * decide which stocks are worth a deeper (and more expensive) AI analysis.
 */
export function scoreSnapshot(
  snapshot: IndicatorSnapshot,
  price: number,
  changePercent: number
): { score: number; reason: string } {
  let score = 50;
  const reasons: string[] = [];

  if (!Number.isNaN(snapshot.rsi)) {
    if (snapshot.rsi < 30) {
      score += 15;
      reasons.push("RSI oversold");
    } else if (snapshot.rsi > 70) {
      score += 10;
      reasons.push("RSI overbought");
    } else if (snapshot.rsi > 45 && snapshot.rsi < 60) {
      score += 5;
    }
  }

  if (!Number.isNaN(snapshot.macdHistogram)) {
    if (snapshot.macd > snapshot.macdSignal) {
      score += 10;
      reasons.push("MACD bullish cross");
    } else {
      score -= 5;
    }
  }

  if (!Number.isNaN(snapshot.sma20) && !Number.isNaN(snapshot.sma50)) {
    if (price > snapshot.sma20 && snapshot.sma20 > snapshot.sma50) {
      score += 12;
      reasons.push("price above rising MAs");
    } else if (price < snapshot.sma20 && snapshot.sma20 < snapshot.sma50) {
      score += 6;
      reasons.push("downtrend structure");
    }
  }

  if (snapshot.volume.spike) {
    score += 10;
    reasons.push("volume spike");
  }

  if (Math.abs(changePercent) > 3) {
    score += 8;
    reasons.push(`strong move ${changePercent.toFixed(1)}%`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score,
    reason: reasons.length ? reasons.join(", ") : "neutral technicals",
  };
}
