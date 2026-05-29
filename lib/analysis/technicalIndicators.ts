import type { OHLCV, VolumeAnalysis } from "@/lib/types";

/**
 * Simple Moving Average. Returns an array aligned to input length where the
 * first (period - 1) entries are NaN (not enough data yet).
 */
export function calculateSMA(data: number[], period: number): number[] {
  const out: number[] = new Array(data.length).fill(NaN);
  if (period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) sum -= data[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/**
 * Exponential Moving Average. Seeded with the SMA of the first `period` values.
 */
export function calculateEMA(data: number[], period: number): number[] {
  const out: number[] = new Array(data.length).fill(NaN);
  if (data.length < period || period <= 0) return out;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = ema;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

/**
 * Relative Strength Index using Wilder's smoothing.
 */
export function calculateRSI(closes: number[], period = 14): number[] {
  const out: number[] = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return out;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum -= diff;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

/**
 * MACD (12, 26, 9). Returns macd line, signal line and histogram aligned to input.
 */
export function calculateMACD(
  closes: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);
  const macd: number[] = closes.map((_, i) =>
    Number.isNaN(emaFast[i]) || Number.isNaN(emaSlow[i]) ? NaN : emaFast[i] - emaSlow[i]
  );

  // Signal = EMA of MACD, computed only over the valid portion.
  const firstValid = macd.findIndex((v) => !Number.isNaN(v));
  const signal: number[] = new Array(closes.length).fill(NaN);
  if (firstValid !== -1) {
    const valid = macd.slice(firstValid);
    const sig = calculateEMA(valid, signalPeriod);
    for (let i = 0; i < sig.length; i++) signal[firstValid + i] = sig[i];
  }

  const histogram: number[] = closes.map((_, i) =>
    Number.isNaN(macd[i]) || Number.isNaN(signal[i]) ? NaN : macd[i] - signal[i]
  );
  return { macd, signal, histogram };
}

/**
 * Bollinger Bands (period 20, 2 standard deviations).
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  mult = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calculateSMA(closes, period);
  const upper: number[] = new Array(closes.length).fill(NaN);
  const lower: number[] = new Array(closes.length).fill(NaN);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + mult * sd;
    lower[i] = mean - mult * sd;
  }
  return { upper, middle, lower };
}

/**
 * Average True Range using Wilder's smoothing.
 */
export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): number[] {
  const n = closes.length;
  const out: number[] = new Array(n).fill(NaN);
  if (n <= period) return out;
  const tr: number[] = new Array(n).fill(NaN);
  tr[0] = highs[0] - lows[0];
  for (let i = 1; i < n; i++) {
    tr[i] = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
  }
  let atr = tr.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  out[period] = atr;
  for (let i = period + 1; i < n; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    out[i] = atr;
  }
  return out;
}

/**
 * Detect swing-pivot based support and resistance levels and cluster them.
 */
export function findSupportResistance(
  ohlcv: OHLCV[],
  lookback = 3
): { supports: number[]; resistances: number[] } {
  const supportsRaw: number[] = [];
  const resistancesRaw: number[] = [];
  for (let i = lookback; i < ohlcv.length - lookback; i++) {
    const window = ohlcv.slice(i - lookback, i + lookback + 1);
    const isLow = window.every((c) => ohlcv[i].low <= c.low);
    const isHigh = window.every((c) => ohlcv[i].high >= c.high);
    if (isLow) supportsRaw.push(ohlcv[i].low);
    if (isHigh) resistancesRaw.push(ohlcv[i].high);
  }
  const lastClose = ohlcv[ohlcv.length - 1]?.close ?? 0;
  const tolerance = lastClose * 0.015;

  const cluster = (levels: number[]): number[] => {
    const sorted = [...levels].sort((a, b) => a - b);
    const clusters: number[] = [];
    let group: number[] = [];
    for (const lvl of sorted) {
      if (group.length === 0 || lvl - group[group.length - 1] <= tolerance) {
        group.push(lvl);
      } else {
        clusters.push(group.reduce((a, b) => a + b, 0) / group.length);
        group = [lvl];
      }
    }
    if (group.length) clusters.push(group.reduce((a, b) => a + b, 0) / group.length);
    return clusters;
  };

  const supports = cluster(supportsRaw)
    .filter((l) => l < lastClose)
    .sort((a, b) => b - a)
    .slice(0, 3);
  const resistances = cluster(resistancesRaw)
    .filter((l) => l > lastClose)
    .sort((a, b) => a - b)
    .slice(0, 3);
  return { supports, resistances };
}

export function analyzeVolume(volumes: number[], closes: number[]): VolumeAnalysis {
  const n = volumes.length;
  if (n === 0) {
    return { trend: "stable", avgVolume: 0, latestVolume: 0, relativeVolume: 0, spike: false };
  }
  const period = Math.min(20, n);
  const recent = volumes.slice(-period);
  const avgVolume = recent.reduce((a, b) => a + b, 0) / period;
  const latestVolume = volumes[n - 1];
  const relativeVolume = avgVolume === 0 ? 0 : latestVolume / avgVolume;

  const firstHalf = recent.slice(0, Math.floor(period / 2));
  const secondHalf = recent.slice(Math.floor(period / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
  let trend: VolumeAnalysis["trend"] = "stable";
  if (secondAvg > firstAvg * 1.15) trend = "increasing";
  else if (secondAvg < firstAvg * 0.85) trend = "decreasing";

  return {
    trend,
    avgVolume,
    latestVolume,
    relativeVolume,
    spike: relativeVolume > 1.8,
  };
}

/** Convenience: last non-NaN value of a series. */
export function lastValue(series: number[]): number {
  for (let i = series.length - 1; i >= 0; i--) {
    if (!Number.isNaN(series[i])) return series[i];
  }
  return NaN;
}
