import { NextResponse } from "next/server";
import { upsertLiveBot } from "@/lib/bots/liveBotDb";
import { parseLiveBotMarket } from "@/lib/bots/validateMarket";
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

  try {
    const bot = await upsertLiveBot(auth.userId, market, {
      is_running: false,
      user_stopped: true,
    });
    return NextResponse.json({ bot });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
