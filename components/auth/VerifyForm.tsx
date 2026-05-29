"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, MailCheck, RefreshCw, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function VerifyForm({ email }: { email: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(true);
  const [masked, setMasked] = useState(email);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const sendCode = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/auth/send-code", { method: "POST" });
      const data = await res.json();
      if (data.email) setMasked(data.email);
      if (!data.throttled) toast.success("Verification code sent to your email 📧");
      setCooldown(30);
    } catch {
      toast.error("Could not send code");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (!clean) {
      setDigits((d) => d.map((x, idx) => (idx === i ? "" : x)));
      return;
    }
    // Support pasting the whole code into one box.
    if (clean.length > 1) {
      const arr = clean.slice(0, 6).split("");
      const next = ["", "", "", "", "", ""].map((_, idx) => arr[idx] ?? "");
      setDigits(next);
      inputs.current[Math.min(arr.length, 5)]?.focus();
      if (arr.length >= 6) submit(next.join(""));
      return;
    }
    setDigits((d) => {
      const nd = d.map((x, idx) => (idx === i ? clean : x));
      if (nd.every((c) => c)) submit(nd.join(""));
      return nd;
    });
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const submit = async (code?: string) => {
    const value = code ?? digits.join("");
    if (value.length !== 6 || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success("Email verified — welcome! 🎉");
        router.push("/trading");
        router.refresh();
      } else {
        toast.error(data.error || "Verification failed");
        setDigits(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      }
    } catch {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-primary/10">
        <MailCheck className="h-7 w-7 text-gold-primary" />
      </div>
      <h1 className="font-display text-2xl font-bold text-white">Verify your email</h1>
      <p className="mt-1 text-sm text-white/50">
        We sent a 6-digit code to <span className="text-white/80">{masked}</span>. Enter it below to
        activate your account.
      </p>

      <div className="mt-6 flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            inputMode="numeric"
            maxLength={6}
            className="h-14 w-12 rounded-xl border border-white/10 bg-white/[0.03] text-center font-mono-data text-2xl font-bold text-white transition focus:border-gold-primary/50 focus:outline-none focus:ring-2 focus:ring-gold-primary/20"
          />
        ))}
      </div>

      <button
        onClick={() => submit()}
        disabled={loading || digits.some((d) => !d)}
        className={cn(
          "mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-primary to-gold-accent py-3 font-semibold text-bg-primary transition hover:shadow-gold-glow",
          (loading || digits.some((d) => !d)) && "opacity-60"
        )}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Verify & continue
      </button>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          onClick={sendCode}
          disabled={sending || cooldown > 0}
          className="flex items-center gap-1.5 text-gold-primary transition hover:underline disabled:text-white/30"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", sending && "animate-spin")} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
        <button onClick={signOut} className="flex items-center gap-1.5 text-white/45 transition hover:text-white">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}
