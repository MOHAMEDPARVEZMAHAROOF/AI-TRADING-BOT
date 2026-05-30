import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/api/yahooFinance";
import { requireApiUser, sanitizeSymbol } from "@/lib/security/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;

  const symbol = sanitizeSymbol(req.nextUrl.searchParams.get("symbol") ?? "");
  if (!symbol) {
    return NextResponse.json({ error: "Missing or invalid 'symbol' parameter" }, { status: 400 });
  }
  try {
    const quote = await getQuote(symbol);
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
