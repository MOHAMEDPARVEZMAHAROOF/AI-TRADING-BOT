import { useAgentStore } from "@/lib/store/agentStore";
import { usePortfolioStore } from "@/lib/store/portfolioStore";
import { FULL_WATCHLIST, RISK, STARTING_BALANCE } from "@/lib/constants";
import { scanMarket } from "./marketScanAgent";
import { deepAnalyse } from "./analysisAgent";
import { evaluateRisk } from "./riskAgent";
import { executeDemoTrade } from "./executionAgent";
import { getQuotesClient } from "@/lib/api/client";

const CYCLE_INTERVAL_MS = 30_000;

/**
 * The brain that coordinates the multi-agent autonomous trading system. It runs
 * on a timer (client-side) and drives one scan -> analyse -> decide -> risk ->
 * execute -> monitor cycle per tick, streaming status updates into the agent store.
 */
class AgentOrchestrator {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private cycleInFlight = false;
  private dayStartValue = STARTING_BALANCE;
  private watchlist = [...FULL_WATCHLIST];
  private scanCursor = 0;

  get isRunning() {
    return this.running;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.dayStartValue = usePortfolioStore.getState().getTotalValue();
    useAgentStore.getState().setRunning(true);
    useAgentStore.getState().log({
      agentName: "Orchestrator",
      agentType: "portfolio",
      action: "Autonomous trading started",
      category: "alert",
    });
    // Kick off immediately, then on an interval.
    void this.runCycle();
    this.schedule();
  }

  stop() {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const store = useAgentStore.getState();
    store.setRunning(false);
    store.agents.forEach((a) => {
      if (a.id !== "portfolio") store.setAgentStatus(a.id, "IDLE", "Idle");
    });
    store.log({
      agentName: "Orchestrator",
      agentType: "portfolio",
      action: "Autonomous trading stopped",
      category: "alert",
    });
  }

  private schedule() {
    if (!this.running) return;
    this.timer = setTimeout(async () => {
      await this.runCycle();
      this.schedule();
    }, CYCLE_INTERVAL_MS);
  }

  async runCycle() {
    if (this.cycleInFlight || !this.running) return;
    this.cycleInFlight = true;
    const agentStore = useAgentStore.getState();
    try {
      agentStore.incrementCycle();
      await this.monitorPositions();
      const flagged = await this.scanPhase();
      if (flagged.length) {
        await this.decideAndExecute(flagged);
      }
    } catch (err) {
      agentStore.log({
        agentName: "Orchestrator",
        agentType: "portfolio",
        action: `Cycle error: ${(err as Error).message}`,
        category: "alert",
      });
    } finally {
      // Reset transient agents to idle between cycles.
      const store = useAgentStore.getState();
      ["scanner", "analysis", "strategy", "risk", "execution"].forEach((id) =>
        store.setAgentStatus(id, "IDLE", "Idle")
      );
      this.cycleInFlight = false;
    }
  }

  /** Rotate through the watchlist in batches so each cycle is fast. */
  private nextBatch(size = 12): string[] {
    const batch: string[] = [];
    for (let i = 0; i < size; i++) {
      batch.push(this.watchlist[this.scanCursor % this.watchlist.length]);
      this.scanCursor++;
    }
    return batch;
  }

  private async scanPhase() {
    const store = useAgentStore.getState();
    const batch = this.nextBatch();
    store.setAgentStatus("scanner", "SCANNING", `Scanning ${batch.length} symbols...`);
    store.log({
      agentName: "Market Scanner",
      agentType: "scanner",
      action: `Scanning batch of ${batch.length} symbols`,
      category: "scan",
    });

    const { scanned, scannedCount } = await scanMarket(batch);
    store.addScanned(scannedCount);
    store.setScanResults(mergeScan(store.scanResults, scanned));

    const flagged = scanned.filter((s) => s.flagged).slice(0, 3);
    for (const f of flagged) {
      store.log({
        agentName: "Market Scanner",
        agentType: "scanner",
        action: `Flagged opportunity (score ${f.score})`,
        symbol: f.symbol,
        category: "scan",
        detail: f.reason,
      });
    }
    store.setAgentStatus("scanner", "IDLE", `Scanned ${scannedCount} symbols`);
    return flagged;
  }

  private async decideAndExecute(flagged: { symbol: string; score: number }[]) {
    const store = useAgentStore.getState();
    for (const f of flagged) {
      if (!this.running) return;
      if (f.score < RISK.minTechnicalScore) continue;

      store.setAgentStatus("analysis", "ANALYSING", `Analysing ${f.symbol}...`);
      store.log({
        agentName: "Technical Analyst",
        agentType: "analysis",
        action: `Deep analysis (score ${f.score})`,
        symbol: f.symbol,
        category: "analysis",
      });

      let decision;
      try {
        decision = await deepAnalyse(f.symbol);
      } catch (err) {
        store.log({
          agentName: "Technical Analyst",
          agentType: "analysis",
          action: `Analysis failed: ${(err as Error).message}`,
          symbol: f.symbol,
          category: "alert",
        });
        continue;
      }

      store.setAgentStatus("strategy", "DECIDING", `Strategy for ${f.symbol}...`);
      store.log({
        agentName: "AI Strategist",
        agentType: "strategy",
        action: `Decision: ${decision.signal.signal} @ ${decision.signal.confidence}% confidence`,
        symbol: f.symbol,
        category: "decision",
        detail: decision.signal.keyReason,
      });

      // Risk evaluation.
      store.setAgentStatus("risk", "DECIDING", `Risk check for ${f.symbol}...`);
      const portfolio = usePortfolioStore.getState();
      const risk = evaluateRisk(f.symbol, decision.signal, {
        totalValue: portfolio.getTotalValue(),
        startingValue: STARTING_BALANCE,
        holdings: portfolio.holdings,
        dayStartValue: this.dayStartValue,
      });

      if (!risk.approved) {
        store.log({
          agentName: "Risk Manager",
          agentType: "risk",
          action: `Rejected: ${risk.reason}`,
          symbol: f.symbol,
          category: "decision",
        });
        continue;
      }

      store.log({
        agentName: "Risk Manager",
        agentType: "risk",
        action: `Approved ${risk.quantity} shares`,
        symbol: f.symbol,
        category: "decision",
      });

      // Execute.
      store.setAgentStatus("execution", "EXECUTING", `Buying ${f.symbol}...`);
      const ok = executeDemoTrade(decision, risk.quantity);
      if (ok) {
        store.incrementTrades();
        store.incrementAgentTrades("execution");
        store.log({
          agentName: "Execution Agent",
          agentType: "execution",
          action: `Bought ${risk.quantity} @ ${decision.signal.entryPrice.toFixed(2)} (T:${decision.signal.targetPrice.toFixed(
            2
          )} SL:${decision.signal.stopLoss.toFixed(2)})`,
          symbol: f.symbol,
          category: "trade",
          detail: decision.pattern,
        });
      } else {
        store.log({
          agentName: "Execution Agent",
          agentType: "execution",
          action: "Execution failed (insufficient balance)",
          symbol: f.symbol,
          category: "alert",
        });
      }
    }
  }

  /** Portfolio monitor: refresh open-position prices and let the store auto-exit. */
  private async monitorPositions() {
    const store = useAgentStore.getState();
    const portfolio = usePortfolioStore.getState();
    const symbols = portfolio.holdings.map((h) => h.symbol);
    if (!symbols.length) return;

    store.setAgentStatus("portfolio", "MONITORING", `Monitoring ${symbols.length} positions`);
    try {
      const quotes = await getQuotesClient(symbols);
      const prices: Record<string, number> = {};
      for (const q of quotes) prices[q.symbol] = q.price;
      const before = portfolio.holdings.length;
      portfolio.updatePrices(prices);
      const after = usePortfolioStore.getState().holdings.length;
      if (after < before) {
        store.log({
          agentName: "Portfolio Monitor",
          agentType: "portfolio",
          action: `Closed ${before - after} position(s) on target/stop`,
          category: "trade",
        });
      }
    } catch {
      // ignore monitor errors; will retry next cycle
    }
  }
}

function mergeScan<T extends { symbol: string }>(prev: T[], next: T[]): T[] {
  const map = new Map(prev.map((p) => [p.symbol, p]));
  for (const n of next) map.set(n.symbol, n);
  return Array.from(map.values());
}

export const orchestrator = new AgentOrchestrator();
