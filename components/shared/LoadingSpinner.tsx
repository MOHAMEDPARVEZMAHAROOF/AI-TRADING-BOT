"use client";

import { cn } from "@/lib/utils";

export function LoadingSpinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-block animate-spin rounded-full border-2 border-gold-primary/20 border-t-gold-primary", className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function ShimmerBlock({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg", className)} />;
}
