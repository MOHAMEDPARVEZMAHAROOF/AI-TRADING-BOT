import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aurum — AI Trading Software",
    short_name: "Aurum",
    description:
      "AI-powered trading: manual AI assistant + autonomous multi-agent trader with real-time market data.",
    start_url: "/trading",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#FFD700",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
