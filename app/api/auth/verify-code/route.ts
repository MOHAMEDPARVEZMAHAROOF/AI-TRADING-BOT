import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildEmail } from "@/lib/email/templates";
import { relayEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/verify-code  Body: { code }
 * Validates the 6-digit code for the signed-in user and marks them verified.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let code: string;
  try {
    const body = await req.json();
    code = String(body.code ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });
  }

  const { data: otp } = await supabase
    .from("email_otps")
    .select("id, code, expires_at, consumed")
    .eq("user_id", user.id)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otp) {
    return NextResponse.json({ error: "No active code — request a new one" }, { status: 400 });
  }
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Code expired — request a new one" }, { status: 400 });
  }
  if (otp.code !== code) {
    return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
  }

  await supabase.from("email_otps").update({ consumed: true }).eq("id", otp.id);
  await supabase.from("profiles").update({ email_verified: true }).eq("id", user.id);

  // Send the themed welcome email now that the account is verified.
  if (user.email) {
    const name =
      (user.user_metadata?.full_name as string) || user.email.split("@")[0];
    const { subject, html } = buildEmail({ type: "welcome", name });
    relayEmail(user.email, subject, html, "welcome").catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
