import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildEmail, type EmailPayload } from "@/lib/email/templates";
import { ACTIVEPIECES_WEBHOOK_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * POST /api/notify
 * Builds a themed HTML email for the event and relays it to the Activepieces
 * Gmail flow webhook. Also records the event in the user's trade_events table.
 */
export async function POST(req: NextRequest) {
  let body: EmailPayload & { to?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.type) {
    return NextResponse.json({ error: "Missing 'type'" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const recipient = user?.email || body.to;
  if (!recipient) {
    return NextResponse.json({ error: "No recipient" }, { status: 400 });
  }

  let notificationsEnabled = true;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email_notifications, full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (profile && profile.email_notifications === false) notificationsEnabled = false;
    if (!body.name && profile?.full_name) body.name = profile.full_name;

    await supabase.from("trade_events").insert({
      user_id: user.id,
      event_type: body.type,
      symbol: body.symbol ?? null,
      company_name: body.companyName ?? null,
      source: body.source ?? null,
      payload: body as unknown as Record<string, unknown>,
    });
  }

  const origin = req.nextUrl.origin;
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/trading`
    : `${origin}/trading`;

  const { subject, html } = buildEmail({ ...body, appUrl });

  let emailSent = false;
  if (notificationsEnabled && ACTIVEPIECES_WEBHOOK_URL) {
    try {
      const res = await fetch(ACTIVEPIECES_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipient, subject, html, type: body.type }),
      });
      emailSent = res.ok;
    } catch {
      emailSent = false;
    }
  }

  return NextResponse.json({ ok: true, emailSent, recorded: Boolean(user) });
}
