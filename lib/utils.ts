import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number | undefined | null, currency = "$"): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `${currency}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatCompact(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function currencyForExchange(exchange?: string): string {
  if (!exchange) return "$";
  const ex = exchange.toUpperCase();
  if (ex.includes("NSE") || ex.includes("BSE") || ex.includes("NSI") || ex.includes("BOM")) return "₹";
  return "$";
}

export function currencyForSymbol(symbol?: string): string {
  if (!symbol) return "$";
  const s = symbol.toUpperCase();
  if (s.endsWith(".NS") || s.endsWith(".BO")) return "₹";
  if (s.includes("-USD") || s.endsWith("=X")) return "$";
  return "$";
}

export function flagForExchange(exchange?: string, symbol?: string): string {
  const s = (symbol || "").toUpperCase();
  if (s.endsWith(".NS") || s.endsWith(".BO")) return "🇮🇳";
  if (s.includes("-USD") || s.includes("-USDT")) return "₿";
  if (s.endsWith("=X")) return "💱";
  const ex = (exchange || "").toUpperCase();
  if (ex.includes("NSE") || ex.includes("BSE") || ex.includes("NSI") || ex.includes("BOM")) return "🇮🇳";
  if (ex.includes("CCC") || ex.includes("CRYPTO")) return "₿";
  if (ex.includes("CCY") || ex.includes("FOREX")) return "💱";
  if (ex.includes("LSE") || ex.includes("LON")) return "🇬🇧";
  if (ex.includes("TSE") || ex.includes("TOR")) return "🇨🇦";
  return "🇺🇸";
}

/** Display-friendly symbol (BTC-USD → BTC, EURUSD=X → EUR/USD). */
export function displaySymbol(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s.endsWith("=X") && s.length >= 6) {
    const pair = s.replace("=X", "");
    return `${pair.slice(0, 3)}/${pair.slice(3)}`;
  }
  if (s.endsWith(".NS")) return s.replace(".NS", "");
  if (s.endsWith(".BO")) return s.replace(".BO", "");
  return s.replace("-USD", "").replace("-USDT", "");
}

export function uid(prefix = ""): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
