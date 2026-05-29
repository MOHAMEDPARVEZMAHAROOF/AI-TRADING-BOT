"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronDown, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function UserMenu({ userName, userEmail }: { userName: string; userEmail: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const signOut = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass-card flex items-center gap-2 px-2.5 py-2 transition hover:border-gold-primary/30"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-primary to-gold-accent text-sm font-bold text-bg-primary">
          {initials || <User className="h-4 w-4" />}
        </span>
        <span className="hidden max-w-[120px] truncate text-sm text-white/80 md:block">{userName}</span>
        <ChevronDown className={cn("h-4 w-4 text-white/40 transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="glass-card absolute right-0 z-50 mt-2 w-60 p-2">
          <div className="border-b border-white/5 px-3 py-2.5">
            <div className="truncate text-sm font-semibold text-white">{userName}</div>
            <div className="truncate text-xs text-white/45">{userEmail}</div>
          </div>
          <button
            onClick={signOut}
            disabled={loading}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-loss transition hover:bg-loss/10"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
