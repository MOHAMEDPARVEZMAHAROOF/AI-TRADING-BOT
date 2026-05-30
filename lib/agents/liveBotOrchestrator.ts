import { useAgentStore } from "@/lib/store/agentStore";
import { usePortfolioStore } from "@/lib/store/portfolioStore";
import {
  CRYPTO_WATCHLIST,
  FOREX_WATCHLIST,
  RISK_CRYPTO,
  RISK_FOREX,
  STARTING_BALANCE,
} from "@/lib/constants";
import { canLiveBotRun, liveBotSchedule } from "@/lib/market/marketHours";
import { scanMarket } from "./marketScanAgent";
import { deepAnalyse } from "./analysisAgent";
import { evaluateRisk } from "./riskAgent";
import { executeDemoTrade } from "./executionAgent";
import { getQuotesClient } from "@/lib/api/client";
import type { LiveBotMarket } from "@/lib/types";

const CYCLE_MS = 28_000;

/**
 * Client-side agentic loop for crypto (24/7) and forex (24/5).
 * Syncs with server persistence so UI reflects cloud bot state.
 */
class LiveBotOrchestrator {
  private timers = new Map<LiveBotMarket, ReturnType<typeof setTimeout>>();
  private running = new Set<LiveBotMarket>();
  private inFlight = new Set<LiveBotMarket>();
  private scanCursor = new Map<LiveBotMarket, number>();
  private dayStart = STARTING_BALANCE;

  isActive(market: LiveBotMarket) {
    return this.running.has(market);
  }

  start(market: LiveBotMarket) {
    if (this.running.has(market)) return;
    this.running.add(market);
    this.dayStart = usePortfolioStore.getState().getTotalValue();
    const store = useAgentStore.getState();
    store.log({
      agentName: `${market === "crypto" ? "Crypto" : "Forex"} Live Bot`,
      agentType: "portfolio",
      action: `24/7 live bot started (${liveBotSchedule(market)}) — agentic layers active`,
      category: "alert",
    });
    void this.runCycle(market);
    this.schedule(market);
  }

  stop(market: LiveBotMarket) {
    this.running.delete(market);
    const t = this.timers.get(market);
    if (t) clearTimeout(t);
    this.timers.delete(market);
    useAgentStore.getState().log({
      agentName: `${market === "crypto" ? "Crypto" : "Forex"} Live Bot`,
      agentType: "portfolio",
      action: "Live bot stopped by user",
      category: "alert",
    });
  }

  stopAll() {
    for (const m of ["crypto", "forex"] as LiveBotMarket[]) this.stop(m);
  }

  /** Resume client loop when server reports bot still running. */
  resumeIfNeeded(market: LiveBotMarket, serverRunning: boolean) {
    if (serverRunning && !this.running.has(market)) this.start(market);
    if (!serverRunning && this.running.has(market)) this.stop(market);
  }

  private schedule(market: LiveBotMarket) {
    const t = setTimeout(async () => {
      await this.runCycle(market);
      if (this.running.has(market)) this.schedule(market);
    }, CYCLE_MS);
    this.timers.set(market, t);
  }

  private watchlist(market: LiveBotMarket) {
    return market === "crypto" ? [...CRYPTO_WATCHLIST] : [...FOREX_WATCHLIST];
  }

  private risk(market: LiveBotMarket) {
    return market === "crypto" ? RISK_CRYPTO : RISK_FOREX;
  }

  private nextBatch(market: LiveBotMarket, size = 10): string[] {
    const list = this.watchlist(market);
    let cursor = this.scanCursor.get(market) ?? 0;
    const batch: string[] = [];
    for (let i = 0; i < size; i++) {
      batch.push(list[cursor % list.length]);
      cursor++;
    }
    this.scanCursor.set(market, cursor);
    return batch;
  }

  async runCycle(market: LiveBotMarket) {
    if (!this.running.has(market) || this.inFlight.has(market)) return;
    if (!canLiveBotRun(market)) return;

    this.inFlight.add(market);
    const agentStore = useAgentStore.getState();
    const riskCfg = this.risk(market);

    try {
      agentStore.incrementCycle();
      const batch = this.nextBatch(market);
      agentStore.setAgentStatus("scanner", "SCANNING", `[${market}] Scanning ${batch.length} pairs…`);
      const { scanned, scannedCount } = await scanMarket(batch);
      agentStore.addScanned(scannedCount);
      const flagged = scanned.filter((s) => s.flagged).slice(0, 2);

      for (const f of flagged) {
        if (!this.running.has(market) || f.score < riskCfg.minTechnicalScore) continue;
        let decision;
        try {
          decision = await deepAnalyse(f.symbol);
        } catch {
          continue;
        }
        if (decision.signal.confidence < riskCfg.minAIConfidence) continue;

        const portfolio = usePortfolioStore.getState();
        const risk = evaluateRisk(f.symbol, decision.signal, {
          totalValue: portfolio.getTotalValue(),
          startingValue: STARTING_BALANCE,
          holdings: portfolio.holdings,
          dayStartValue: this.dayStart,
        });
        if (!risk.approved) continue;

        const ok = executeDemoTrade(decision, risk.quantity);
        if (ok) {
          agentStore.incrementTrades();
          agentStore.log({
            agentName: "Execution Agent",
            agentType: "execution",
            action: `[${market}] Live bot executed paper trade`,
            symbol: f.symbol,
            category: "trade",
          });
        }
      }

      const holdings = usePortfolioStore.getState().holdings.map((h) => h.symbol);
      if (holdings.length) {
        const quotes = await getQuotesClient(holdings);
        const prices: Record<string, number> = {};
        for (const q of quotes) prices[q.symbol] = q.price;
        usePortfolioStore.getState().updatePrices(prices);
      }
    } finally {
      this.inFlight.delete(market);
      agentStore.setAgentStatus("scanner", "IDLE", "Idle");
    }
  }
}

export const liveBotOrchestrator = new LiveBotOrchestrator();
