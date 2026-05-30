import { NextResponse } from "next/server";
import { getLiveBot, upsertLiveBot } from "@/lib/bots/liveBotDb";
import { parseLiveBotMarket } from "@/lib/bots/validateMarket";
import { canLiveBotRun } from "@/lib/market/marketHours";
import { requireApiUser } from "@/lib/security/apiAuth";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { market: string } }
) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;

  const market = parseLiveBotMarket(params.market);
  if (!market) return NextResponse.json({ error: "Invalid market" }, { status: 400 });

  if (market === "forex" && !canLiveBotRun("forex")) {
    return NextResponse.json(
      { error: "Forex markets are closed for the weekend. Bot will be available when markets reopen." },
      { status: 400 }
    );
  }

  try {
    const existing = await getLiveBot(auth.userId, market);
    const bot = await upsertLiveBot(auth.userId, market, {
      is_running: true,
      user_stopped: false,
      started_at: existing.startedAt && existing.isRunning
        ? new Date(existing.startedAt).toISOString()
        : new Date().toISOString(),
      last_tick_at: new Date().toISOString(),
    });
    return NextResponse.json({ bot });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
