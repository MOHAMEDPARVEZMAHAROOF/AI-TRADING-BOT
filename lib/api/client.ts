import type { AISignal, OHLCV, SearchResult, StockQuote } from "@/lib/types";

export async function getQuoteClient(symbol: string): Promise<StockQuote> {
  const res = await fetch(`/api/stock/quote?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error((await safeError(res)) || `Quote failed for ${symbol}`);
  return res.json();
}

/**
 * Fetch quotes for many symbols in a single request (server batches them).
 */
export async function getMarketQuotes(symbols: string[]): Promise<StockQuote[]> {
  if (!symbols.length) return [];
  const res = await fetch("/api/stock/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbols }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.quotes ?? []) as StockQuote[];
}

export async function getQuotesClient(symbols: string[]): Promise<StockQuote[]> {
  return getMarketQuotes(symbols);
}

export async function getHistoryClient(
  symbol: string,
  range = "6m",
  interval = "1d"
): Promise<OHLCV[]> {
  const res = await fetch(
    `/api/stock/history?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`
  );
  if (!res.ok) throw new Error((await safeError(res)) || `History failed for ${symbol}`);
  const data = await res.json();
  return data.candles as OHLCV[];
}

export async function searchSymbolsClient(query: string): Promise<SearchResult[]> {
  const res = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []) as SearchResult[];
}

/**
 * Stream the AI analysis as text. Calls onChunk with the accumulated text so the
 * UI can render a live typing effect. Resolves with the parsed AISignal.
 */
export async function streamAnalysis(
  symbol: string,
  onChunk: (accumulated: string) => void
): Promise<{ signal: AISignal | null; raw: string; source: string }> {
  const res = await fetch("/api/ai/analyse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
  if (!res.ok || !res.body) {
    throw new Error((await safeError(res)) || "AI analysis failed");
  }
  const source = res.headers.get("X-AI-Source") ?? "groq";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    raw += decoder.decode(value, { stream: true });
    onChunk(raw);
  }
  return { signal: parseSignal(raw), raw, source };
}

function parseSignal(text: string): AISignal | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as AISignal;
  } catch {
    return null;
  }
}

async function safeError(res: Response): Promise<string | null> {
  try {
    const data = await res.clone().json();
    return data.error ?? null;
  } catch {
    return null;
  }
}
