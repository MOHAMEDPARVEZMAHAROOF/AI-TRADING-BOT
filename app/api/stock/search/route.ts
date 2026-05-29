import { NextRequest, NextResponse } from "next/server";
import { searchSymbols } from "@/lib/api/yahooFinance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json({ results: [] });
  }
  try {
    const results = await searchSymbols(q.trim());
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=120" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Search failed", detail: (err as Error).message, results: [] },
      { status: 502 }
    );
  }
}
