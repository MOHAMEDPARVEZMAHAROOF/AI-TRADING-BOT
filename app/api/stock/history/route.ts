import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@/lib/api/yahooFinance";
import { requireApiUser, sanitizeSymbol } from "@/lib/security/apiAuth";

export const dynamic = "force-dynamic";

const VALID_INTERVALS = ["5m", "15m", "1h", "1d", "1wk", "1mo"] as const;
type Interval = (typeof VALID_INTERVALS)[number];

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;

  const params = req.nextUrl.searchParams;
  const symbol = sanitizeSymbol(params.get("symbol") ?? "");
  const range = params.get("range") ?? "6m";
  const intervalParam = (params.get("interval") ?? "1d") as Interval;
  const interval = VALID_INTERVALS.includes(intervalParam) ? intervalParam : "1d";

  if (!symbol) {
    return NextResponse.json({ error: "Missing or invalid 'symbol' parameter" }, { status: 400 });
  }
  try {
    const data = await getHistory(symbol, range, interval);
    if (!data.length) {
      return NextResponse.json(
        { error: `No historical data for ${symbol}` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { symbol, range, interval, candles: data },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=60" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Could not fetch history for ${symbol}`, detail: (err as Error).message },
      { status: 502 }
    );
  }
}
