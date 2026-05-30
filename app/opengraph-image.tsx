import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Aurum — AI Trading Software";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(1200px 600px at 80% -10%, rgba(255,215,0,0.25), transparent), #0a0a0f",
          color: "#fff",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "linear-gradient(135deg,#FFD700,#FFAA00)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0a0a0f",
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            AT
          </div>
          <div style={{ fontSize: 40, color: "#FFD700", fontWeight: 700 }}>Aurum</div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 40, lineHeight: 1.1 }}>
          AI Trading Software
        </div>
        <div style={{ fontSize: 34, color: "rgba(255,255,255,0.7)", marginTop: 20, fontFamily: "sans-serif" }}>
          Real-time markets · Groq AI analysis · Autonomous agents
        </div>
      </div>
    ),
    { ...size }
  );
}
