import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runLiveBotTick } from "@/lib/bots/liveBotRunner";
import type { LiveBotMarket } from "@/lib/types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Vercel Cron endpoint — processes all running live bots.
 * Set CRON_SECRET in env and Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY required for cron" },
      { status: 503 }
    );
  }

  const supabase = createClient(SUPABASE_URL, serviceKey);
  const { data: rows, error } = await supabase
    .from("live_bots")
    .select("user_id, market, cycle_count, is_running, user_stopped")
    .eq("is_running", true)
    .eq("user_stopped", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { user_id: string; market: string; ok: boolean }[] = [];

  for (const row of rows ?? []) {
    const market = row.market as LiveBotMarket;
    const tick = await runLiveBotTick(market);
    await supabase
      .from("live_bots")
      .update({
        last_tick_at: new Date().toISOString(),
        cycle_count: (row.cycle_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", row.user_id)
      .eq("market", market);
    results.push({ user_id: row.user_id, market, ok: tick.ok });
  }

  return NextResponse.json({ processed: results.length, results });
}
