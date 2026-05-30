"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Animated price display that flashes green/red when the value changes.
 */
export function PriceTag({
  value,
  currency = "$",
  className,
  decimals = 2,
}: {
  value: number;
  currency?: string;
  className?: string;
  decimals?: number;
}) {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"" | "flash-green" | "flash-red">("");

  useEffect(() => {
    if (value > prev.current) setFlash("flash-green");
    else if (value < prev.current) setFlash("flash-red");
    prev.current = value;
    const t = setTimeout(() => setFlash(""), 600);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span className={cn("font-mono-data rounded px-1 transition-colors", flash, className)}>
      {currency}
      {value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
