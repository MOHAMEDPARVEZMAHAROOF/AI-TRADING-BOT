import type { AISignal, IndicatorSnapshot, OHLCV, PatternResult, StockQuote } from "@/lib/types";

export interface AnalysisInput {
  quote: StockQuote;
  indicators: IndicatorSnapshot;
  patterns: PatternResult[];
  recentOHLCV: OHLCV[];
}

function fmt(v: number, digits = 2): string {
  return Number.isFinite(v) ? v.toFixed(digits) : "n/a";
}

/**
 * Build the full analyst prompt sent to Claude.
 */
export function buildAnalysisPrompt(input: AnalysisInput): string {
  const { quote, indicators: i, patterns, recentOHLCV } = input;
  const rsiLabel = i.rsi > 70 ? "OVERBOUGHT" : i.rsi < 30 ? "OVERSOLD" : "NEUTRAL";
  const recent = recentOHLCV.slice(-20).map((o) => ({
    date: o.date.slice(0, 10),
    o: +o.open.toFixed(2),
    h: +o.high.toFixed(2),
    l: +o.low.toFixed(2),
    c: +o.close.toFixed(2),
    v: o.volume,
  }));

  return `You are an expert quantitative trading analyst. Analyse this stock and provide a precise trading recommendation.

Stock: ${quote.symbol} (${quote.longName || quote.shortName})
Exchange: ${quote.exchange}
Current Price: ${fmt(quote.price)} ${quote.currency}
Market Cap: ${quote.marketCap ?? "n/a"}

Technical Data (last 20 candles, OHLCV):
${JSON.stringify(recent)}

Calculated Indicators:
- RSI(14): ${fmt(i.rsi)} — ${rsiLabel}
- MACD: ${fmt(i.macd, 4)}, Signal: ${fmt(i.macdSignal, 4)}, Histogram: ${fmt(i.macdHistogram, 4)}
- SMA20: ${fmt(i.sma20)}, SMA50: ${fmt(i.sma50)}, SMA200: ${fmt(i.sma200)}, EMA9: ${fmt(i.ema9)}
- Bollinger Bands: Upper ${fmt(i.bbUpper)}, Middle ${fmt(i.bbMiddle)}, Lower ${fmt(i.bbLower)}
- ATR(14): ${fmt(i.atr)} (volatility measure)
- Key Support: ${i.supports.map((s) => fmt(s)).join(", ") || "n/a"}
- Key Resistance: ${i.resistances.map((s) => fmt(s)).join(", ") || "n/a"}
- Volume Trend: ${i.volume.trend} (relative volume ${fmt(i.volume.relativeVolume)})

Detected Patterns: ${
    patterns.length
      ? patterns.map((p) => `${p.pattern} (${p.confidence}% confidence)`).join(", ")
      : "none"
  }

Provide your analysis as JSON only, with no prose outside the JSON object:
{
  "signal": "BUY" | "SELL" | "HOLD" | "WATCH",
  "confidence": 0-100,
  "entryPrice": number,
  "targetPrice": number,
  "stopLoss": number,
  "riskRewardRatio": number,
  "timeframe": "short-term (days)" | "medium-term (weeks)" | "long-term (months)",
  "keyReason": "One concise sentence explaining the primary signal driver",
  "bullishFactors": ["factor1", "factor2", "factor3"],
  "bearishFactors": ["factor1", "factor2"],
  "patternExplanation": "Which pattern triggered this and what it means",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "marketContext": "Brief note on broader market context",
  "suggestedAction": "Detailed actionable advice in 2-3 sentences"
}`;
}

/**
 * Build a concise prompt for the autonomous agent's strategy decision.
 */
export function buildAgentDecisionPrompt(input: AnalysisInput, score: number): string {
  const { quote, indicators: i, patterns } = input;
  return `You are an autonomous trading agent. Based on the technical data, decide if this is a high-confidence trade setup. Be conservative. Only recommend execution if all signals align strongly. Respond with JSON only.

Stock: ${quote.symbol} | Price: ${fmt(quote.price)} ${quote.currency} | Change: ${fmt(quote.changePercent)}%
Technical readiness score: ${score}/100
RSI: ${fmt(i.rsi)} | MACD hist: ${fmt(i.macdHistogram, 4)} | SMA20: ${fmt(i.sma20)} | SMA50: ${fmt(i.sma50)} | ATR: ${fmt(i.atr)}
Support: ${i.supports.map((s) => fmt(s)).join(", ") || "n/a"} | Resistance: ${i.resistances.map((s) => fmt(s)).join(", ") || "n/a"}
Patterns: ${patterns.map((p) => p.pattern).join(", ") || "none"}

JSON shape:
{
  "signal": "BUY" | "SELL" | "HOLD" | "WATCH",
  "confidence": 0-100,
  "entryPrice": number,
  "targetPrice": number,
  "stopLoss": number,
  "riskRewardRatio": number,
  "timeframe": string,
  "keyReason": string,
  "bullishFactors": [string],
  "bearishFactors": [string],
  "patternExplanation": string,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "marketContext": string,
  "suggestedAction": string
}`;
}

/**
 * Deterministic local fallback used when the Claude API is unavailable. Produces
 * a sensible signal from the computed indicators so the app still works end-to-end.
 */
export function localFallbackSignal(input: AnalysisInput): AISignal {
  const { quote, indicators: i, patterns } = input;
  const price = quote.price;
  let bullScore = 0;
  let bearScore = 0;
  const bullish: string[] = [];
  const bearish: string[] = [];

  if (i.rsi < 30) {
    bullScore += 2;
    bullish.push(`RSI oversold at ${i.rsi.toFixed(0)}`);
  } else if (i.rsi > 70) {
    bearScore += 2;
    bearish.push(`RSI overbought at ${i.rsi.toFixed(0)}`);
  }
  if (i.macd > i.macdSignal) {
    bullScore += 1;
    bullish.push("MACD above signal line");
  } else {
    bearScore += 1;
    bearish.push("MACD below signal line");
  }
  if (price > i.sma50) {
    bullScore += 1;
    bullish.push("Price above SMA50");
  } else {
    bearScore += 1;
    bearish.push("Price below SMA50");
  }
  for (const p of patterns) {
    if (p.type === "bullish") {
      bullScore += 1;
      bullish.push(`${p.pattern} pattern`);
    } else if (p.type === "bearish") {
      bearScore += 1;
      bearish.push(`${p.pattern} pattern`);
    }
  }

  const net = bullScore - bearScore;
  let signal: AISignal["signal"] = "HOLD";
  if (net >= 2) signal = "BUY";
  else if (net <= -2) signal = "SELL";
  else if (Math.abs(net) === 1) signal = "WATCH";

  const atr = Number.isFinite(i.atr) && i.atr > 0 ? i.atr : price * 0.02;
  const isBuy = signal === "BUY";
  const target = isBuy ? price + atr * 3 : price - atr * 3;
  const stop = isBuy ? price - atr * 1.5 : price + atr * 1.5;
  const rr = Math.abs((target - price) / (price - stop || 1));

  return {
    signal,
    confidence: Math.min(90, 50 + Math.abs(net) * 10),
    entryPrice: +price.toFixed(2),
    targetPrice: +target.toFixed(2),
    stopLoss: +stop.toFixed(2),
    riskRewardRatio: +rr.toFixed(2),
    timeframe: "short-term (days)",
    keyReason:
      bullish[0] || bearish[0] || "Mixed technical signals suggest waiting for confirmation.",
    bullishFactors: bullish.slice(0, 3),
    bearishFactors: bearish.slice(0, 2),
    patternExplanation: patterns.length
      ? `${patterns[0].pattern}: ${patterns[0].description}`
      : "No dominant candlestick pattern detected.",
    riskLevel: i.atr / price > 0.04 ? "HIGH" : i.atr / price > 0.02 ? "MEDIUM" : "LOW",
    marketContext: "Computed locally from technical indicators (AI offline).",
    suggestedAction:
      signal === "BUY"
        ? "Technical setup leans bullish. Consider a position with the stated stop-loss and target."
        : signal === "SELL"
        ? "Technical setup leans bearish. Consider reducing exposure or avoiding new longs."
        : "Signals are mixed — wait for clearer confirmation before acting.",
  };
}
