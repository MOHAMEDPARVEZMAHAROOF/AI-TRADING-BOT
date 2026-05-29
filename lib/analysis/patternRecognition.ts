import type { OHLCV, PatternResult } from "@/lib/types";
import { calculateSMA } from "./technicalIndicators";

function body(c: OHLCV): number {
  return Math.abs(c.close - c.open);
}
function range(c: OHLCV): number {
  return c.high - c.low || 1e-9;
}
function upperWick(c: OHLCV): number {
  return c.high - Math.max(c.open, c.close);
}
function lowerWick(c: OHLCV): number {
  return Math.min(c.open, c.close) - c.low;
}
function isBull(c: OHLCV): boolean {
  return c.close >= c.open;
}

/**
 * Detect candlestick and chart patterns over the OHLCV series.
 * Returns the most recent / highest-confidence matches.
 */
export function detectPatterns(ohlcv: OHLCV[]): PatternResult[] {
  const results: PatternResult[] = [];
  const n = ohlcv.length;
  if (n < 3) return results;

  const last = n - 1;
  const c = ohlcv[last];
  const p = ohlcv[last - 1];

  // --- Single candle patterns on the latest candle ---
  const b = body(c);
  const r = range(c);

  // Doji
  if (b / r < 0.1) {
    results.push({
      pattern: "Doji",
      type: "neutral",
      confidence: 60,
      description: "Open and close are nearly equal, signalling indecision.",
      candleIndex: last,
    });
  }

  // Hammer (bullish reversal)
  if (lowerWick(c) > 2 * b && upperWick(c) < b) {
    results.push({
      pattern: "Hammer",
      type: "bullish",
      confidence: 68,
      description: "Long lower wick with small body — potential bullish reversal.",
      candleIndex: last,
    });
  }

  // Inverted Hammer
  if (upperWick(c) > 2 * b && lowerWick(c) < b && isBull(c)) {
    results.push({
      pattern: "Inverted Hammer",
      type: "bullish",
      confidence: 60,
      description: "Long upper wick after a decline — possible bullish reversal.",
      candleIndex: last,
    });
  }

  // Shooting Star (bearish)
  if (upperWick(c) > 2 * b && lowerWick(c) < b && !isBull(c)) {
    results.push({
      pattern: "Shooting Star",
      type: "bearish",
      confidence: 66,
      description: "Long upper wick with small body — potential bearish reversal.",
      candleIndex: last,
    });
  }

  // --- Two candle patterns ---
  // Bullish Engulfing
  if (!isBull(p) && isBull(c) && c.close > p.open && c.open < p.close) {
    results.push({
      pattern: "Bullish Engulfing",
      type: "bullish",
      confidence: 75,
      description: "Current green candle fully engulfs the prior red candle.",
      candleIndex: last,
    });
  }
  // Bearish Engulfing
  if (isBull(p) && !isBull(c) && c.open > p.close && c.close < p.open) {
    results.push({
      pattern: "Bearish Engulfing",
      type: "bearish",
      confidence: 75,
      description: "Current red candle fully engulfs the prior green candle.",
      candleIndex: last,
    });
  }

  // --- Three candle patterns ---
  if (n >= 3) {
    const a = ohlcv[last - 2];
    // Morning Star (bullish)
    if (
      !isBull(a) &&
      body(p) / range(p) < 0.4 &&
      isBull(c) &&
      c.close > (a.open + a.close) / 2
    ) {
      results.push({
        pattern: "Morning Star",
        type: "bullish",
        confidence: 78,
        description: "Three-candle bullish reversal after a downtrend.",
        candleIndex: last,
      });
    }
    // Evening Star (bearish)
    if (
      isBull(a) &&
      body(p) / range(p) < 0.4 &&
      !isBull(c) &&
      c.close < (a.open + a.close) / 2
    ) {
      results.push({
        pattern: "Evening Star",
        type: "bearish",
        confidence: 78,
        description: "Three-candle bearish reversal after an uptrend.",
        candleIndex: last,
      });
    }
    // Three White Soldiers
    if (
      isBull(a) &&
      isBull(p) &&
      isBull(c) &&
      p.close > a.close &&
      c.close > p.close
    ) {
      results.push({
        pattern: "Three White Soldiers",
        type: "bullish",
        confidence: 72,
        description: "Three consecutive strong green candles — strong bullish momentum.",
        candleIndex: last,
      });
    }
    // Three Black Crows
    if (
      !isBull(a) &&
      !isBull(p) &&
      !isBull(c) &&
      p.close < a.close &&
      c.close < p.close
    ) {
      results.push({
        pattern: "Three Black Crows",
        type: "bearish",
        confidence: 72,
        description: "Three consecutive strong red candles — strong bearish momentum.",
        candleIndex: last,
      });
    }
  }

  // --- Golden / Death cross ---
  const closes = ohlcv.map((o) => o.close);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  if (!Number.isNaN(sma50[last]) && !Number.isNaN(sma200[last]) && !Number.isNaN(sma50[last - 1])) {
    if (sma50[last - 1] <= sma200[last - 1] && sma50[last] > sma200[last]) {
      results.push({
        pattern: "Golden Cross",
        type: "bullish",
        confidence: 82,
        description: "SMA50 crossed above SMA200 — long-term bullish signal.",
        candleIndex: last,
      });
    }
    if (sma50[last - 1] >= sma200[last - 1] && sma50[last] < sma200[last]) {
      results.push({
        pattern: "Death Cross",
        type: "bearish",
        confidence: 82,
        description: "SMA50 crossed below SMA200 — long-term bearish signal.",
        candleIndex: last,
      });
    }
  }

  // --- Breakout / Breakdown vs recent range ---
  if (n >= 21) {
    const window = ohlcv.slice(last - 20, last);
    const hi = Math.max(...window.map((o) => o.high));
    const lo = Math.min(...window.map((o) => o.low));
    if (c.close > hi) {
      results.push({
        pattern: "Breakout Above Resistance",
        type: "bullish",
        confidence: 70,
        description: "Price closed above the 20-period high — breakout.",
        candleIndex: last,
      });
    }
    if (c.close < lo) {
      results.push({
        pattern: "Breakdown Below Support",
        type: "bearish",
        confidence: 70,
        description: "Price closed below the 20-period low — breakdown.",
        candleIndex: last,
      });
    }
  }

  // --- Double Top / Double Bottom (simplified) ---
  if (n >= 30) {
    const seg = ohlcv.slice(last - 30, last + 1);
    const dbl = detectDouble(seg, last - 30);
    if (dbl) results.push(dbl);
  }

  // Sort by confidence and dedupe by pattern name.
  const seen = new Set<string>();
  return results
    .sort((x, y) => y.confidence - x.confidence)
    .filter((r) => {
      if (seen.has(r.pattern)) return false;
      seen.add(r.pattern);
      return true;
    })
    .slice(0, 6);
}

function detectDouble(seg: OHLCV[], offset: number): PatternResult | null {
  const highs = seg.map((o) => o.high);
  const lows = seg.map((o) => o.low);
  const maxH = Math.max(...highs);
  const minL = Math.min(...lows);
  const tol = (maxH - minL) * 0.04;

  const peakIdx = highs.reduce<number[]>((acc, h, i) => {
    if (Math.abs(h - maxH) <= tol) acc.push(i);
    return acc;
  }, []);
  if (peakIdx.length >= 2 && peakIdx[peakIdx.length - 1] - peakIdx[0] > 5) {
    return {
      pattern: "Double Top",
      type: "bearish",
      confidence: 64,
      description: "Two peaks at a similar level — potential bearish reversal.",
      candleIndex: offset + peakIdx[peakIdx.length - 1],
    };
  }

  const troughIdx = lows.reduce<number[]>((acc, l, i) => {
    if (Math.abs(l - minL) <= tol) acc.push(i);
    return acc;
  }, []);
  if (troughIdx.length >= 2 && troughIdx[troughIdx.length - 1] - troughIdx[0] > 5) {
    return {
      pattern: "Double Bottom",
      type: "bullish",
      confidence: 64,
      description: "Two troughs at a similar level — potential bullish reversal.",
      candleIndex: offset + troughIdx[troughIdx.length - 1],
    };
  }
  return null;
}
