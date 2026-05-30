"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="glass-card max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-loss/10">
          <AlertTriangle className="h-7 w-7 text-loss" />
        </div>
        <h2 className="font-display text-xl font-bold text-white">Something went wrong</h2>
        <p className="mt-2 text-sm text-white/55">
          {error.message || "An unexpected error occurred while rendering this view."}
        </p>
        <button
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-primary to-gold-accent px-5 py-2.5 font-semibold text-bg-primary transition hover:shadow-gold-glow"
        >
          <RotateCw className="h-4 w-4" /> Try again
        </button>
      </div>
    </div>
  );
}
