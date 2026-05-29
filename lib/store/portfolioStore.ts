import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Holding, NotificationItem, Trade } from "@/lib/types";
import { STARTING_BALANCE } from "@/lib/constants";
import { uid } from "@/lib/utils";
import { notify } from "@/lib/notify";

export interface BuyOrder {
  symbol: string;
  companyName: string;
  exchange: string;
  currency: string;
  quantity: number;
  price: number;
  targetPrice?: number;
  stopLoss?: number;
  aiSignal?: string;
  aiConfidence?: number;
  pattern?: string;
  source: "manual" | "auto";
}

interface PortfolioState {
  balance: number;
  holdings: Holding[];
  trades: Trade[];
  notifications: NotificationItem[];
  valueHistory: { time: number; value: number }[];

  executeBuy: (order: BuyOrder) => { ok: boolean; message: string };
  executeSell: (symbol: string, quantity: number, price: number, reason?: Trade["status"]) => { ok: boolean; message: string };
  closePosition: (symbol: string, price: number) => void;
  updatePrices: (prices: Record<string, number>) => void;
  addNotification: (n: Omit<NotificationItem, "id" | "timestamp">) => void;
  snapshotValue: () => void;
  reset: () => void;

  getHolding: (symbol: string) => Holding | undefined;
  getHoldingsValue: () => number;
  getTotalValue: () => number;
  getTotalPnL: () => number;
  getTotalPnLPercent: () => number;
  getWinRate: () => number;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      balance: STARTING_BALANCE,
      holdings: [],
      trades: [],
      notifications: [],
      valueHistory: [],

      executeBuy: (order) => {
        const cost = order.price * order.quantity;
        if (order.quantity <= 0) return { ok: false, message: "Quantity must be positive" };
        if (cost > get().balance) {
          return { ok: false, message: "Insufficient demo balance" };
        }
        set((state) => {
          const existing = state.holdings.find((h) => h.symbol === order.symbol);
          let holdings: Holding[];
          if (existing) {
            const totalQty = existing.quantity + order.quantity;
            const avgEntry = (existing.avgEntry * existing.quantity + cost) / totalQty;
            holdings = state.holdings.map((h) =>
              h.symbol === order.symbol
                ? {
                    ...h,
                    quantity: totalQty,
                    avgEntry,
                    currentPrice: order.price,
                    targetPrice: order.targetPrice ?? h.targetPrice,
                    stopLoss: order.stopLoss ?? h.stopLoss,
                    aiSignal: order.aiSignal ?? h.aiSignal,
                  }
                : h
            );
          } else {
            holdings = [
              ...state.holdings,
              {
                symbol: order.symbol,
                companyName: order.companyName,
                exchange: order.exchange,
                currency: order.currency,
                quantity: order.quantity,
                avgEntry: order.price,
                currentPrice: order.price,
                targetPrice: order.targetPrice,
                stopLoss: order.stopLoss,
                aiSignal: order.aiSignal,
                source: order.source,
                openedAt: Date.now(),
              },
            ];
          }
          const trade: Trade = {
            id: uid("t_"),
            symbol: order.symbol,
            companyName: order.companyName,
            exchange: order.exchange,
            currency: order.currency,
            type: "BUY",
            quantity: order.quantity,
            entryPrice: order.price,
            targetPrice: order.targetPrice,
            stopLoss: order.stopLoss,
            entryTime: Date.now(),
            status: "OPEN",
            pattern: order.pattern,
            source: order.source,
            aiConfidence: order.aiConfidence,
          };
          const notification: NotificationItem = {
            id: uid("n_"),
            timestamp: Date.now(),
            title: `Bought ${order.symbol}`,
            message: `${order.quantity} @ ${order.currency}${order.price.toFixed(2)} (${order.source})`,
            type: "trade",
          };
          return {
            balance: state.balance - cost,
            holdings,
            trades: [trade, ...state.trades],
            notifications: [notification, ...state.notifications].slice(0, 200),
          };
        });
        get().snapshotValue();

        notify({
          type: order.source === "auto" ? "agent_trade" : "trade_executed",
          symbol: order.symbol,
          companyName: order.companyName,
          quantity: order.quantity,
          price: order.price,
          targetPrice: order.targetPrice,
          stopLoss: order.stopLoss,
          confidence: order.aiConfidence,
          currency: order.currency,
          source: order.source,
        });
        return { ok: true, message: `Bought ${order.quantity} ${order.symbol}` };
      },

      executeSell: (symbol, quantity, price, reason = "CLOSED") => {
        const holding = get().holdings.find((h) => h.symbol === symbol);
        if (!holding) return { ok: false, message: "No open position" };
        const qty = Math.min(quantity, holding.quantity);
        const proceeds = price * qty;
        const pnl = (price - holding.avgEntry) * qty;
        const pnlPercent = ((price - holding.avgEntry) / holding.avgEntry) * 100;

        set((state) => {
          const remaining = holding.quantity - qty;
          const holdings =
            remaining > 0
              ? state.holdings.map((h) =>
                  h.symbol === symbol ? { ...h, quantity: remaining, currentPrice: price } : h
                )
              : state.holdings.filter((h) => h.symbol !== symbol);

          let closed = false;
          const trades = state.trades.map((t) => {
            if (!closed && t.symbol === symbol && t.status === "OPEN") {
              closed = true;
              return {
                ...t,
                status: reason,
                exitPrice: price,
                exitTime: Date.now(),
                quantity: qty,
                pnl,
                pnlPercent,
              };
            }
            return t;
          });

          const label =
            reason === "TARGET_HIT"
              ? `Target hit on ${symbol}`
              : reason === "STOP_HIT"
              ? `Stop-loss hit on ${symbol}`
              : `Closed ${symbol}`;
          const notification: NotificationItem = {
            id: uid("n_"),
            timestamp: Date.now(),
            title: label,
            message: `${pnl >= 0 ? "+" : ""}${holding.currency}${pnl.toFixed(2)} (${pnlPercent.toFixed(1)}%)`,
            type: reason === "TARGET_HIT" || reason === "STOP_HIT" ? "price-alert" : "trade",
          };

          return {
            balance: state.balance + proceeds,
            holdings,
            trades,
            notifications: [notification, ...state.notifications].slice(0, 200),
          };
        });
        get().snapshotValue();

        notify({
          type:
            reason === "TARGET_HIT"
              ? "target_hit"
              : reason === "STOP_HIT"
              ? "stop_hit"
              : "position_closed",
          symbol,
          companyName: holding.companyName,
          quantity: qty,
          entryPrice: holding.avgEntry,
          exitPrice: price,
          pnl,
          pnlPercent,
          currency: holding.currency,
          source: holding.source,
        });
        return { ok: true, message: `Sold ${qty} ${symbol}` };
      },

      closePosition: (symbol, price) => {
        const holding = get().holdings.find((h) => h.symbol === symbol);
        if (holding) get().executeSell(symbol, holding.quantity, price, "CLOSED");
      },

      updatePrices: (prices) => {
        set((state) => {
          const holdings = state.holdings.map((h) =>
            prices[h.symbol] != null ? { ...h, currentPrice: prices[h.symbol] } : h
          );
          return { holdings };
        });
        const holdings = get().holdings;
        for (const h of holdings) {
          const price = prices[h.symbol];
          if (price == null) continue;
          if (h.targetPrice && price >= h.targetPrice) {
            get().executeSell(h.symbol, h.quantity, price, "TARGET_HIT");
          } else if (h.stopLoss && price <= h.stopLoss) {
            get().executeSell(h.symbol, h.quantity, price, "STOP_HIT");
          }
        }
      },

      addNotification: (n) =>
        set((state) => ({
          notifications: [
            { ...n, id: uid("n_"), timestamp: Date.now() },
            ...state.notifications,
          ].slice(0, 200),
        })),

      snapshotValue: () => {
        const value = get().getTotalValue();
        set((state) => {
          const last = state.valueHistory[state.valueHistory.length - 1];
          const time = Math.floor(Date.now() / 1000);
          if (last && time - last.time < 2) {
            return { valueHistory: [...state.valueHistory.slice(0, -1), { time, value }] };
          }
          return { valueHistory: [...state.valueHistory, { time, value }].slice(-500) };
        });
      },

      reset: () =>
        set({
          balance: STARTING_BALANCE,
          holdings: [],
          trades: [],
          notifications: [],
          valueHistory: [],
        }),

      getHolding: (symbol) => get().holdings.find((h) => h.symbol === symbol),
      getHoldingsValue: () =>
        get().holdings.reduce((acc, h) => acc + h.currentPrice * h.quantity, 0),
      getTotalValue: () => get().balance + get().getHoldingsValue(),
      getTotalPnL: () => get().getTotalValue() - STARTING_BALANCE,
      getTotalPnLPercent: () => (get().getTotalPnL() / STARTING_BALANCE) * 100,
      getWinRate: () => {
        const closed = get().trades.filter((t) => t.status !== "OPEN" && t.pnl != null);
        if (!closed.length) return 0;
        const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;
        return (wins / closed.length) * 100;
      },
    }),
    {
      name: "ai-trader-portfolio",
      version: 1,
      partialize: (state) => ({
        balance: state.balance,
        holdings: state.holdings,
        trades: state.trades,
        notifications: state.notifications,
        valueHistory: state.valueHistory,
      }),
    }
  )
);
