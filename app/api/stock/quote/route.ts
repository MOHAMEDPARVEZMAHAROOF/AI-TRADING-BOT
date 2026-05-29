import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/api/yahooFinance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Missing 'symbol' parameter" }, { status: 400 });
  }
  try {
    const quote = await getQuote(symbol.toUpperCase());
    return NextResponse.json(quote, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=30" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not fetch quote for ${symbol}`, detail: (err as Error).message },
      { status: 502 }
    );
  }
}
