import { NextRequest, NextResponse } from "next/server";
import { getQuotesBatch } from "@/lib/api/yahooFinance";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET  /api/stock/quotes?symbols=AAPL,MSFT,RELIANCE.NS
 * POST /api/stock/quotes  { symbols: string[] }
 * Returns live quotes for a basket of symbols (no history) — used by the
 * markets watchlist and the autonomous scanner grid.
 */
async function handle(symbols: string[]) {
  const clean = symbols
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 60);
  if (!clean.length) {
    return NextResponse.json({ error: "No symbols provided", quotes: [] }, { status: 400 });
  }
  const quotes = await getQuotesBatch(clean);
  return NextResponse.json(
    { quotes },
    { headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=20" } }
  );
}

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("symbols") ?? "";
  return handle(param.split(","));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return handle(Array.isArray(body.symbols) ? body.symbols : []);
  } catch {
    return NextResponse.json({ error: "Invalid JSON", quotes: [] }, { status: 400 });
  }
}
