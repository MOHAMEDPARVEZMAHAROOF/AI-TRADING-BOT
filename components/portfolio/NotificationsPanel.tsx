"use client";

import { useState } from "react";
import { Bell, Target, Zap, Bot, Info } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import type { NotificationItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "price-alert" | "trade" | "agent";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "price-alert": Target,
  trade: Zap,
  agent: Bot,
  info: Info,
};

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  "price-alert": "Price Alerts",
  trade: "Trades",
  agent: "Agent",
};

export function NotificationsPanel({ notifications }: { notifications: NotificationItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = notifications.filter((n) => filter === "all" || n.type === filter);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-white">
          <Bell className="h-4 w-4 text-gold-primary" /> Notifications
        </h3>
      </div>
      <div className="mb-3 flex flex-wrap gap-1">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] transition",
              filter === f ? "bg-gold-primary/15 text-gold-primary" : "text-white/45 hover:bg-white/5"
            )}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 360 }}>
        {filtered.length === 0 && (
          <div className="flex h-24 items-center justify-center text-sm text-white/35">
            No notifications.
          </div>
        )}
        {filtered.map((n) => {
          const Icon = ICONS[n.type] ?? Info;
          return (
            <div key={n.id} className="flex gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold-primary/10">
                <Icon className="h-3.5 w-3.5 text-gold-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-white">{n.title}</span>
                  <span className="shrink-0 text-[10px] text-white/35">
                    {formatDistanceToNowStrict(n.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="truncate text-xs text-white/55">{n.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
