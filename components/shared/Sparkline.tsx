"use client";

/**
 * Minimal dependency-free SVG sparkline for a series of closing prices.
 */
export function Sparkline({
  values,
  width = 320,
  height = 72,
  up = true,
}: {
  values: number[];
  width?: number;
  height?: number;
  up?: boolean;
}) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < 2) {
    return <div className="flex h-[72px] items-center justify-center text-xs text-white/30">No chart data</div>;
  }
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const pad = 4;
  const stepX = (width - pad * 2) / (clean.length - 1);
  const points = clean.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${(width - pad).toFixed(1)},${height - pad}`;
  const color = up ? "#00FF88" : "#FF4466";
  const gid = `spark-${up ? "u" : "d"}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
