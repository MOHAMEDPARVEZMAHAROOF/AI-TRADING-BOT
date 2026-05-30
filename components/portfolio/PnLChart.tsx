"use client";

import { useEffect, useRef } from "react";
import { createChart, LineStyle, type UTCTimestamp } from "lightweight-charts";

export function PnLChart({ data }: { data: { time: number; value: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height: ref.current.clientHeight,
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(255,255,255,0.6)",
        fontFamily: "var(--font-jetbrains), monospace",
      },
      grid: {
        vertLines: { color: "rgba(255,215,0,0.04)" },
        horzLines: { color: "rgba(255,215,0,0.04)" },
      },
      rightPriceScale: { borderColor: "rgba(255,215,0,0.18)" },
      timeScale: { borderColor: "rgba(255,215,0,0.18)", timeVisible: true },
      crosshair: { horzLine: { style: LineStyle.Dashed }, vertLine: { style: LineStyle.Dashed } },
    });
    const series = chart.addAreaSeries({
      lineColor: "#FFD700",
      topColor: "rgba(255,215,0,0.35)",
      bottomColor: "rgba(255,215,0,0.02)",
      lineWidth: 2,
    });

    // Ensure strictly ascending unique times.
    const seen = new Set<number>();
    const clean = data
      .filter((d) => {
        if (seen.has(d.time)) return false;
        seen.add(d.time);
        return true;
      })
      .sort((a, b) => a.time - b.time)
      .map((d) => ({ time: d.time as UTCTimestamp, value: d.value }));

    series.setData(clean);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (ref.current) chart.applyOptions({ width: ref.current.clientWidth, height: ref.current.clientHeight });
    });
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [data]);

  if (data.length < 2) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/35">
        Performance chart will appear after your first trades.
      </div>
    );
  }
  return <div ref={ref} className="h-full w-full" />;
}
