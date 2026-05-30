import { NextResponse } from "next/server";
import { getLiveBot, upsertLiveBot } from "@/lib/bots/liveBotDb";
import { runLiveBotTick } from "@/lib/bots/liveBotRunner";
import { parseLiveBotMarket } from "@/lib/bots/validateMarket";
import { requireApiUser } from "@/lib/security/apiAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Authenticated tick — advances server-side analysis while bot is running. */
export async function POST(
  req: Request,
  { params }: { params: { market: string } }
) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;

  const market = parseLiveBotMarket(params.market);
  if (!market) return NextResponse.json({ error: "Invalid market" }, { status: 400 });

  try {
    const current = await getLiveBot(auth.userId, market);
    if (!current.isRunning || current.userStopped) {
      return NextResponse.json({ bot: current, tick: null });
    }

    const tick = await runLiveBotTick(market);
    const bot = await upsertLiveBot(auth.userId, market, {
      is_running: tick.ok !== false,
      last_tick_at: new Date().toISOString(),
      cycle_count: current.cycleCount + 1,
    });
    return NextResponse.json({ bot, tick });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
