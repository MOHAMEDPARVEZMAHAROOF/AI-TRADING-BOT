import { NextResponse } from "next/server";
import { getLiveBot } from "@/lib/bots/liveBotDb";
import { parseLiveBotMarket } from "@/lib/bots/validateMarket";
import { requireApiUser } from "@/lib/security/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { market: string } }
) {
  const auth = await requireApiUser(_req);
  if (!auth.ok) return auth.response;

  const market = parseLiveBotMarket(params.market);
  if (!market) return NextResponse.json({ error: "Invalid market" }, { status: 400 });

  try {
    const bot = await getLiveBot(auth.userId, market);
    return NextResponse.json({ bot });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
