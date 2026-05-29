"use client";

import type { Holding } from "@/lib/types";

const COLORS = ["#FFD700", "#FFAA00", "#4488FF", "#AA66FF", "#00FF88", "#FF4466", "#FFC200", "#66CCFF"];

export function AllocationDonut({
  holdings,
  cash,
}: {
  holdings: Holding[];
  cash: number;
}) {
  const segments = [
    ...holdings.map((h) => ({ label: h.symbol, value: h.currentPrice * h.quantity })),
    { label: "Cash", value: cash },
  ].filter((s) => s.value > 0);

  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
  const radius = 70;
  const stroke = 26;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        {segments.map((s, i) => {
          const fraction = s.value / total;
          const dash = fraction * circumference;
          const seg = (
            <circle
              key={s.label}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={s.label === "Cash" ? "rgba(255,255,255,0.15)" : COLORS[i % COLORS.length]}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return seg;
        })}
      </svg>
      <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1.5">
        {segments.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.label === "Cash" ? "rgba(255,255,255,0.3)" : COLORS[i % COLORS.length] }}
            />
            <span className="text-white/70">{s.label}</span>
            <span className="ml-auto font-mono-data text-white/50">
              {((s.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
