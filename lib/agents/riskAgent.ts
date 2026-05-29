import type { AISignal, Holding } from "@/lib/types";
import { RISK } from "@/lib/constants";

export interface RiskContext {
  totalValue: number;
  startingValue: number;
  holdings: Holding[];
  dayStartValue: number;
}

export interface RiskDecision {
  approved: boolean;
  reason: string;
  quantity: number;
}

/**
 * Pure risk-management logic. Decides whether an AI-recommended trade may execute
 * and sizes the position according to the configured limits.
 */
export function evaluateRisk(
  symbol: string,
  signal: AISignal,
  ctx: RiskContext
): RiskDecision {
  if (signal.signal !== "BUY") {
    return { approved: false, reason: "Signal is not BUY", quantity: 0 };
  }
  if (signal.confidence < RISK.minAIConfidence) {
    return {
      approved: false,
      reason: `Confidence ${signal.confidence}% below ${RISK.minAIConfidence}% threshold`,
      quantity: 0,
    };
  }

  // Daily loss limit.
  const dayPnLPct = ((ctx.totalValue - ctx.dayStartValue) / ctx.dayStartValue) * 100;
  if (dayPnLPct <= -RISK.dailyLossLimitPct * 100) {
    return { approved: false, reason: "Daily loss limit reached — trading paused", quantity: 0 };
  }

  // Max open positions.
  const alreadyHeld = ctx.holdings.find((h) => h.symbol === symbol);
  if (!alreadyHeld && ctx.holdings.length >= RISK.maxOpenPositions) {
    return { approved: false, reason: "Max open positions reached", quantity: 0 };
  }

  // Position sizing.
  const budget = ctx.totalValue * RISK.positionSizePct;
  const price = signal.entryPrice > 0 ? signal.entryPrice : 1;
  let quantity = Math.floor(budget / price);
  if (quantity < 1) {
    return { approved: false, reason: "Position too small for budget", quantity: 0 };
  }

  // Single-position concentration check.
  const existingExposure = alreadyHeld ? alreadyHeld.currentPrice * alreadyHeld.quantity : 0;
  const newExposure = existingExposure + quantity * price;
  const maxExposure = ctx.totalValue * RISK.maxSinglePositionPct;
  if (newExposure > maxExposure) {
    quantity = Math.max(0, Math.floor((maxExposure - existingExposure) / price));
    if (quantity < 1) {
      return { approved: false, reason: "Would exceed 20% single-stock exposure", quantity: 0 };
    }
  }

  return { approved: true, reason: "Risk checks passed", quantity };
}
