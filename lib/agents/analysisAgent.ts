import type { AISignal, StockQuote } from "@/lib/types";

export interface AgentDecision {
  symbol: string;
  quote: StockQuote;
  score: number;
  pattern?: string;
  signal: AISignal;
  source: string;
}

/**
 * Client-side helper that runs the full server pipeline (technical analysis +
 * AI strategy decision) for a single symbol.
 */
export async function deepAnalyse(symbol: string): Promise<AgentDecision> {
  const res = await fetch("/api/agents/trade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
  if (!res.ok) {
    throw new Error(`Analysis failed for ${symbol} (${res.status})`);
  }
  return res.json();
}
