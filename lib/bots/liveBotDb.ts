import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LiveBotMarket, LiveBotState } from "@/lib/types";
import { liveBotSchedule } from "@/lib/market/marketHours";

function rowToState(market: LiveBotMarket, row: Record<string, unknown>): LiveBotState {
  return {
    market,
    isRunning: Boolean(row.is_running),
    userStopped: Boolean(row.user_stopped),
    startedAt: row.started_at ? new Date(row.started_at as string).getTime() : null,
    lastTickAt: row.last_tick_at ? new Date(row.last_tick_at as string).getTime() : null,
    cycleCount: Number(row.cycle_count ?? 0),
    tradesExecuted: Number(row.trades_executed ?? 0),
    schedule: liveBotSchedule(market),
  };
}

export async function getLiveBot(userId: string, market: LiveBotMarket): Promise<LiveBotState> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("live_bots")
    .select("*")
    .eq("user_id", userId)
    .eq("market", market)
    .maybeSingle();

  if (error || !data) {
    return {
      market,
      isRunning: false,
      userStopped: true,
      startedAt: null,
      lastTickAt: null,
      cycleCount: 0,
      tradesExecuted: 0,
      schedule: liveBotSchedule(market),
    };
  }
  return rowToState(market, data as Record<string, unknown>);
}

export async function upsertLiveBot(
  userId: string,
  market: LiveBotMarket,
  patch: Partial<{
    is_running: boolean;
    user_stopped: boolean;
    cycle_count: number;
    trades_executed: number;
    started_at: string | null;
    last_tick_at: string | null;
  }>
): Promise<LiveBotState> {
  const supabase = createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("live_bots")
    .upsert(
      {
        user_id: userId,
        market,
        updated_at: now,
        ...patch,
      },
      { onConflict: "user_id,market" }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update live bot");
  }
  return rowToState(market, data as Record<string, unknown>);
}
