"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
  type SeriesMarker,
} from "lightweight-charts";
import type { AISignal, OHLCV, PatternResult } from "@/lib/types";
import {
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
} from "@/lib/analysis/technicalIndicators";

export type ChartType = "candlestick" | "line" | "area";

const baseLayout = {
  layout: {
    background: { color: "#0a0a0f" },
    textColor: "rgba(255, 255, 255, 0.6)",
    fontFamily: "var(--font-jetbrains), monospace",
  },
  grid: {
    vertLines: { color: "rgba(255, 215, 0, 0.05)" },
    horzLines: { color: "rgba(255, 215, 0, 0.05)" },
  },
  rightPriceScale: { borderColor: "rgba(255, 215, 0, 0.18)" },
  timeScale: { borderColor: "rgba(255, 215, 0, 0.18)", timeVisible: true, secondsVisible: false },
};

const candleColors = {
  upColor: "#00FF88",
  downColor: "#FF4466",
  borderUpColor: "#00FF88",
  borderDownColor: "#FF4466",
  wickUpColor: "#00FF88",
  wickDownColor: "#FF4466",
};

function toTime(o: OHLCV): UTCTimestamp {
  return o.time as UTCTimestamp;
}

export function StockChart({
  candles,
  chartType,
  signal,
  patterns,
  livePrice,
}: {
  candles: OHLCV[];
  chartType: ChartType;
  signal: AISignal | null;
  patterns: PatternResult[];
  livePrice?: number;
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);
  const macdRef = useRef<HTMLDivElement>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line" | "Area"> | null>(null);
  const lastBarRef = useRef<OHLCV | null>(null);

  useEffect(() => {
    if (!mainRef.current || !rsiRef.current || !macdRef.current || candles.length === 0) return;

    const main = createChart(mainRef.current, {
      ...baseLayout,
      width: mainRef.current.clientWidth,
      height: mainRef.current.clientHeight,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255, 215, 0, 0.4)", style: LineStyle.Dashed, width: 1 },
        horzLine: { color: "rgba(255, 215, 0, 0.4)", style: LineStyle.Dashed, width: 1 },
      },
    });
    const rsi = createChart(rsiRef.current, {
      ...baseLayout,
      width: rsiRef.current.clientWidth,
      height: rsiRef.current.clientHeight,
      crosshair: { mode: CrosshairMode.Normal },
    });
    const macd = createChart(macdRef.current, {
      ...baseLayout,
      width: macdRef.current.clientWidth,
      height: macdRef.current.clientHeight,
      crosshair: { mode: CrosshairMode.Normal },
    });

    const closes = candles.map((c) => c.close);

    // --- Main price series ---
    let priceSeries: ISeriesApi<"Candlestick" | "Line" | "Area">;
    if (chartType === "candlestick") {
      const s = main.addCandlestickSeries(candleColors);
      s.setData(
        candles.map((c) => ({
          time: toTime(c),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
      priceSeries = s;
    } else if (chartType === "area") {
      const s = main.addAreaSeries({
        lineColor: "#FFD700",
        topColor: "rgba(255, 215, 0, 0.4)",
        bottomColor: "rgba(255, 215, 0, 0.02)",
        lineWidth: 2,
      });
      s.setData(candles.map((c) => ({ time: toTime(c), value: c.close })));
      priceSeries = s;
    } else {
      const s = main.addLineSeries({ color: "#FFD700", lineWidth: 2 });
      s.setData(candles.map((c) => ({ time: toTime(c), value: c.close })));
      priceSeries = s;
    }
    priceSeriesRef.current = priceSeries;
    lastBarRef.current = candles[candles.length - 1];

    // --- Moving average overlays ---
    const addMA = (values: number[], color: string, width: 1 | 2 = 1) => {
      const series = main.addLineSeries({
        color,
        lineWidth: width,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      series.setData(
        candles
          .map((c, i) => ({ time: toTime(c), value: values[i] }))
          .filter((d) => !Number.isNaN(d.value))
      );
    };
    addMA(calculateSMA(closes, 20), "rgba(68, 136, 255, 0.9)");
    addMA(calculateSMA(closes, 50), "rgba(170, 102, 255, 0.9)");
    addMA(calculateEMA(closes, 9), "rgba(255, 170, 0, 0.9)");

    // --- Markers: AI signal entry + detected patterns ---
    const markers: SeriesMarker<Time>[] = [];
    for (const p of patterns) {
      const idx = Math.min(Math.max(p.candleIndex, 0), candles.length - 1);
      markers.push({
        time: toTime(candles[idx]),
        position: p.type === "bullish" ? "belowBar" : "aboveBar",
        color: p.type === "bullish" ? "#00FF88" : p.type === "bearish" ? "#FF4466" : "#FFD700",
        shape: p.type === "bullish" ? "arrowUp" : p.type === "bearish" ? "arrowDown" : "circle",
        text: p.pattern,
      });
    }
    if (signal && (signal.signal === "BUY" || signal.signal === "SELL")) {
      const lastC = candles[candles.length - 1];
      markers.push({
        time: toTime(lastC),
        position: signal.signal === "BUY" ? "belowBar" : "aboveBar",
        color: "#FFD700",
        shape: signal.signal === "BUY" ? "arrowUp" : "arrowDown",
        text: `${signal.signal} ${signal.confidence}%`,
      });
      priceSeries.createPriceLine({
        price: signal.targetPrice,
        color: "#00FF88",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Target",
      });
      priceSeries.createPriceLine({
        price: signal.stopLoss,
        color: "#FF4466",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Stop",
      });
      priceSeries.createPriceLine({
        price: signal.entryPrice,
        color: "#FFD700",
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: "Entry",
      });
    }
    priceSeries.setMarkers(markers.sort((a, b) => (a.time as number) - (b.time as number)));

    // --- Volume (overlay on main, scaled to bottom) ---
    const volSeries = main.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    main.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volSeries.setData(
      candles.map((c) => ({
        time: toTime(c),
        value: c.volume,
        color: c.close >= c.open ? "rgba(0,255,136,0.35)" : "rgba(255,68,102,0.35)",
      }))
    );

    // --- RSI sub-chart ---
    const rsiValues = calculateRSI(closes, 14);
    const rsiSeries = rsi.addLineSeries({ color: "#FFD700", lineWidth: 2, lastValueVisible: true });
    rsiSeries.setData(
      candles.map((c, i) => ({ time: toTime(c), value: rsiValues[i] })).filter((d) => !Number.isNaN(d.value))
    );
    [70, 30].forEach((level) =>
      rsiSeries.createPriceLine({
        price: level,
        color: level === 70 ? "rgba(255,68,102,0.5)" : "rgba(0,255,136,0.5)",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `${level}`,
      })
    );

    // --- MACD sub-chart ---
    const { macd: macdLine, signal: sigLine, histogram } = calculateMACD(closes);
    const histSeries = macd.addHistogramSeries({ priceLineVisible: false });
    histSeries.setData(
      candles
        .map((c, i) => ({
          time: toTime(c),
          value: histogram[i],
          color: histogram[i] >= 0 ? "rgba(0,255,136,0.5)" : "rgba(255,68,102,0.5)",
        }))
        .filter((d) => !Number.isNaN(d.value))
    );
    const macdSeries = macd.addLineSeries({ color: "#4488FF", lineWidth: 2, lastValueVisible: false });
    macdSeries.setData(
      candles.map((c, i) => ({ time: toTime(c), value: macdLine[i] })).filter((d) => !Number.isNaN(d.value))
    );
    const sigSeries = macd.addLineSeries({ color: "#FFAA00", lineWidth: 1, lastValueVisible: false });
    sigSeries.setData(
      candles.map((c, i) => ({ time: toTime(c), value: sigLine[i] })).filter((d) => !Number.isNaN(d.value))
    );

    // --- Sync time scales across the three charts ---
    const charts = [main, rsi, macd];
    let syncing = false;
    const syncFns: Array<() => void> = [];
    charts.forEach((src) => {
      const handler = (range: any) => {
        if (syncing || !range) return;
        syncing = true;
        charts.forEach((dst) => {
          if (dst !== src) dst.timeScale().setVisibleLogicalRange(range);
        });
        syncing = false;
      };
      src.timeScale().subscribeVisibleLogicalRangeChange(handler);
      syncFns.push(() => src.timeScale().unsubscribeVisibleLogicalRangeChange(handler));
    });

    main.timeScale().fitContent();
    rsi.timeScale().fitContent();
    macd.timeScale().fitContent();

    const resize = () => {
      if (mainRef.current) main.applyOptions({ width: mainRef.current.clientWidth, height: mainRef.current.clientHeight });
      if (rsiRef.current) rsi.applyOptions({ width: rsiRef.current.clientWidth, height: rsiRef.current.clientHeight });
      if (macdRef.current) macd.applyOptions({ width: macdRef.current.clientWidth, height: macdRef.current.clientHeight });
    };
    const ro = new ResizeObserver(resize);
    if (mainRef.current) ro.observe(mainRef.current);

    return () => {
      syncFns.forEach((fn) => fn());
      ro.disconnect();
      priceSeriesRef.current = null;
      lastBarRef.current = null;
      main.remove();
      rsi.remove();
      macd.remove();
    };
  }, [candles, chartType, signal, patterns]);

  // --- Live price: update the last bar in place (no chart recreate, no flicker) ---
  useEffect(() => {
    const series = priceSeriesRef.current;
    const last = lastBarRef.current;
    if (!series || !last || !livePrice || !Number.isFinite(livePrice)) return;
    if (chartType === "candlestick") {
      (series as ISeriesApi<"Candlestick">).update({
        time: last.time as UTCTimestamp,
        open: last.open,
        high: Math.max(last.high, livePrice),
        low: Math.min(last.low, livePrice),
        close: livePrice,
      });
    } else {
      (series as ISeriesApi<"Line" | "Area">).update({
        time: last.time as UTCTimestamp,
        value: livePrice,
      });
    }
  }, [livePrice, chartType]);

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="relative flex-1 min-h-[260px]" ref={mainRef}>
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex gap-3 text-[10px] text-white/50">
          <span className="text-info">— SMA20</span>
          <span className="text-agent">— SMA50</span>
          <span className="text-gold-accent">— EMA9</span>
        </div>
      </div>
      <div className="relative h-[110px]" ref={rsiRef}>
        <span className="pointer-events-none absolute left-2 top-1 z-10 text-[10px] text-white/50">RSI (14)</span>
      </div>
      <div className="relative h-[110px]" ref={macdRef}>
        <span className="pointer-events-none absolute left-2 top-1 z-10 text-[10px] text-white/50">MACD (12,26,9)</span>
      </div>
    </div>
  );
}
