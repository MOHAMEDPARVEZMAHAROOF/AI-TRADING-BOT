import { usePortfolioStore, type BuyOrder } from "@/lib/store/portfolioStore";
import type { AgentDecision } from "./analysisAgent";
import { currencyForSymbol } from "@/lib/utils";

/**
 * Executes an approved demo trade through the portfolio store.
 */
export function executeDemoTrade(decision: AgentDecision, quantity: number): boolean {
  const order: BuyOrder = {
    symbol: decision.symbol,
    companyName: decision.quote.longName || decision.quote.shortName,
    exchange: decision.quote.exchange,
    currency: currencyForSymbol(decision.symbol),
    quantity,
    price: decision.signal.entryPrice || decision.quote.price,
    targetPrice: decision.signal.targetPrice,
    stopLoss: decision.signal.stopLoss,
    aiSignal: decision.signal.signal,
    aiConfidence: decision.signal.confidence,
    pattern: decision.pattern,
    source: "auto",
  };
  const result = usePortfolioStore.getState().executeBuy(order);
  return result.ok;
}
