/**
 * Themed HTML email templates matching the Aurum white & gold glassmorphism brand.
 * Pure string builders — safe to use on the server. Inline styles only (email-safe).
 */

export type EmailType =
  | "welcome"
  | "trade_executed"
  | "target_hit"
  | "stop_hit"
  | "position_closed"
  | "agent_trade";

export interface EmailPayload {
  type: EmailType;
  name?: string;
  symbol?: string;
  companyName?: string;
  quantity?: number;
  price?: number;
  entryPrice?: number;
  exitPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  pnl?: number;
  pnlPercent?: number;
  currency?: string;
  signal?: string;
  confidence?: number;
  source?: string;
  appUrl?: string;
}

const GOLD = "#FFD700";
const GOLD_ACCENT = "#FFAA00";
const BG = "#0a0a0f";
const CARD = "#12121c";
const GREEN = "#00FF88";
const RED = "#FF4466";
const TEXT = "#FFFFFF";
const MUTED = "#9aa0aa";

function money(v: number | undefined, currency = "$"): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${currency}${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function shell(inner: string, preheader: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="dark" />
<title>Aurum AI Trading</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${CARD};border:1px solid rgba(255,215,0,0.18);border-radius:20px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,0.5);">
  <!-- Header -->
  <tr><td style="padding:28px 32px;background:linear-gradient(135deg, rgba(255,215,0,0.14), rgba(170,102,255,0.08));border-bottom:1px solid rgba(255,215,0,0.15);">
    <table role="presentation" width="100%"><tr>
      <td style="vertical-align:middle;">
        <table role="presentation"><tr>
          <td style="width:44px;height:44px;background:linear-gradient(135deg,${GOLD},${GOLD_ACCENT});border-radius:12px;text-align:center;vertical-align:middle;font-weight:800;font-size:18px;color:${BG};">AT</td>
          <td style="padding-left:12px;">
            <div style="font-size:20px;font-weight:800;color:${GOLD};letter-spacing:0.5px;">Aurum</div>
            <div style="font-size:11px;color:${MUTED};">AI Trading Suite</div>
          </td>
        </tr></table>
      </td>
      <td align="right" style="vertical-align:middle;">
        <span style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:${GOLD};border:1px solid rgba(255,215,0,0.3);padding:5px 10px;border-radius:20px;">Demo Mode</span>
      </td>
    </tr></table>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px;">${inner}</td></tr>
  <!-- CTA -->
  <tr><td style="padding:0 32px 32px;">
    <a href="${appUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,${GOLD},${GOLD_ACCENT});color:${BG};text-decoration:none;font-weight:700;padding:14px;border-radius:12px;font-size:15px;">Open Dashboard →</a>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <div style="font-size:11px;color:${MUTED};line-height:1.6;">You're receiving this because you enabled notifications on Aurum.<br/>This is a paper-trading demo — no real money is involved. Not financial advice.</div>
  </td></tr>
</table>
<div style="font-size:11px;color:#555;margin-top:16px;">© ${new Date().getFullYear()} Aurum AI Trading</div>
</td></tr>
</table>
</body>
</html>`;
}

function heading(title: string, sub: string): string {
  return `<h1 style="margin:0 0 6px;font-size:24px;color:${TEXT};font-weight:800;">${title}</h1>
<p style="margin:0 0 20px;font-size:14px;color:${MUTED};line-height:1.6;">${sub}</p>`;
}

function statRow(label: string, value: string, color = TEXT): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:${MUTED};">${label}</td>
    <td align="right" style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;font-weight:700;color:${color};font-family:'Courier New',monospace;">${value}</td>
  </tr>`;
}

function pill(text: string, color: string): string {
  return `<span style="display:inline-block;background:${color}22;color:${color};border:1px solid ${color}55;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">${text}</span>`;
}

export function buildEmail(p: EmailPayload): { subject: string; html: string } {
  const appUrl = p.appUrl || "https://aurum-ai-trading.vercel.app/trading";
  const cur = p.currency || "$";
  const sym = p.symbol || "";
  const company = p.companyName || sym;

  switch (p.type) {
    case "welcome": {
      const inner =
        heading(`Welcome aboard, ${escape(p.name || "Trader")}! 🎉`,
          "Your Aurum account is ready. You've got <b style='color:#fff'>$100,000</b> in virtual capital to trade with AI — completely risk-free.") +
        `<table role="presentation" width="100%" style="margin:8px 0 4px;">
          ${featureRow("📈", "AI Trading Assistant", "Search any stock for live charts & Claude-powered buy/sell signals.")}
          ${featureRow("🤖", "Autonomous Agents", "Let a multi-agent system scan, analyse and trade for you.")}
          ${featureRow("💼", "Smart Portfolio", "Track holdings, P&L and full trade history in real time.")}
        </table>`;
      return { subject: "Welcome to Aurum AI Trading 🎉", html: shell(inner, "Your AI trading account is ready.", appUrl) };
    }

    case "trade_executed":
    case "agent_trade": {
      const auto = p.type === "agent_trade" || p.source === "auto";
      const inner =
        `<div style="margin-bottom:16px;">${pill(`${auto ? "🤖 Auto " : ""}BUY ${sym}`, GREEN)}</div>` +
        heading(`Trade executed: ${escape(sym)}`,
          `${auto ? "An autonomous agent" : "You"} opened a position in <b style="color:#fff">${escape(company)}</b>.`) +
        `<table role="presentation" width="100%" style="border-collapse:collapse;">
          ${statRow("Quantity", String(p.quantity ?? "—"))}
          ${statRow("Entry price", money(p.price ?? p.entryPrice, cur))}
          ${p.targetPrice != null ? statRow("Target", money(p.targetPrice, cur), GREEN) : ""}
          ${p.stopLoss != null ? statRow("Stop loss", money(p.stopLoss, cur), RED) : ""}
          ${p.confidence != null ? statRow("AI confidence", `${p.confidence}%`, GOLD) : ""}
        </table>`;
      return { subject: `✅ Bought ${sym} — Aurum`, html: shell(inner, `Position opened in ${sym}.`, appUrl) };
    }

    case "target_hit": {
      const inner =
        `<div style="margin-bottom:16px;">${pill("🎯 Target Hit", GREEN)}</div>` +
        heading(`Target reached on ${escape(sym)}!`,
          `Your position in <b style="color:#fff">${escape(company)}</b> hit its target and was closed for a profit.`) +
        pnlBlock(p, cur);
      return { subject: `🎯 Target hit on ${sym} (+${(p.pnlPercent ?? 0).toFixed(1)}%) — Aurum`, html: shell(inner, `Target hit on ${sym}.`, appUrl) };
    }

    case "stop_hit": {
      const inner =
        `<div style="margin-bottom:16px;">${pill("⚠️ Stop Loss", RED)}</div>` +
        heading(`Stop-loss triggered on ${escape(sym)}`,
          `Your position in <b style="color:#fff">${escape(company)}</b> hit its stop-loss and was closed to limit risk.`) +
        pnlBlock(p, cur);
      return { subject: `⚠️ Stop-loss hit on ${sym} — Aurum`, html: shell(inner, `Stop-loss hit on ${sym}.`, appUrl) };
    }

    case "position_closed":
    default: {
      const win = (p.pnl ?? 0) >= 0;
      const inner =
        `<div style="margin-bottom:16px;">${pill("Position Closed", win ? GREEN : RED)}</div>` +
        heading(`Closed ${escape(sym)}`,
          `You closed your position in <b style="color:#fff">${escape(company)}</b>.`) +
        pnlBlock(p, cur);
      return { subject: `Position closed: ${sym} — Aurum`, html: shell(inner, `Position closed: ${sym}.`, appUrl) };
    }
  }
}

function pnlBlock(p: EmailPayload, cur: string): string {
  const win = (p.pnl ?? 0) >= 0;
  const color = win ? GREEN : RED;
  return `<div style="text-align:center;margin:8px 0 20px;padding:24px;background:${color}11;border:1px solid ${color}33;border-radius:16px;">
    <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${MUTED};margin-bottom:6px;">Realised P&L</div>
    <div style="font-size:34px;font-weight:800;color:${color};font-family:'Courier New',monospace;">${win ? "+" : ""}${money(p.pnl, cur)}</div>
    <div style="font-size:15px;color:${color};font-weight:700;">${win ? "+" : ""}${(p.pnlPercent ?? 0).toFixed(1)}%</div>
  </div>
  <table role="presentation" width="100%" style="border-collapse:collapse;">
    ${statRow("Entry price", money(p.entryPrice, cur))}
    ${statRow("Exit price", money(p.exitPrice, cur))}
    ${p.quantity != null ? statRow("Quantity", String(p.quantity)) : ""}
  </table>`;
}

function featureRow(icon: string, title: string, desc: string): string {
  return `<tr><td style="padding:10px 0;">
    <table role="presentation"><tr>
      <td style="width:40px;height:40px;background:rgba(255,215,0,0.1);border-radius:10px;text-align:center;vertical-align:middle;font-size:18px;">${icon}</td>
      <td style="padding-left:12px;">
        <div style="font-size:14px;font-weight:700;color:${TEXT};">${title}</div>
        <div style="font-size:12px;color:${MUTED};">${desc}</div>
      </td>
    </tr></table>
  </td></tr>`;
}

function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}
