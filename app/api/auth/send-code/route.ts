import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildEmail } from "@/lib/email/templates";
import { relayEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/send-code
 * Generates a 6-digit verification code for the signed-in user, stores it, and
 * emails it via the Activepieces Gmail flow.
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Light throttle: don't resend if a code was issued in the last 30s.
  const { data: recent } = await supabase
    .from("email_otps")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent && Date.now() - new Date(recent.created_at).getTime() < 30_000) {
    return NextResponse.json({ ok: true, throttled: true });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 10 * 60_000).toISOString();

  const { error: insErr } = await supabase
    .from("email_otps")
    .insert({ user_id: user.id, code, expires_at: expires });
  if (insErr) {
    return NextResponse.json({ error: "Could not create code" }, { status: 500 });
  }

  const { subject, html } = buildEmail({ type: "verify", code, name: user.email });
  const sent = await relayEmail(user.email, subject, html, "verify");

  return NextResponse.json({ ok: true, sent, email: maskEmail(user.email) });
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const shown = name.slice(0, 2);
  return `${shown}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}
