import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/components/shared/ToasterProvider";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurum-ai-trading.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aurum — AI Trading Software",
    template: "%s · Aurum",
  },
  description:
    "Premium AI-powered trading: a manual AI assistant with live charts and an autonomous multi-agent trader. Real-time market data, Groq AI analysis. Paper-trading platform.",
  applicationName: "Aurum",
  keywords: ["AI trading", "stock analysis", "trading bot", "autonomous trading", "TradingView", "Groq"],
  openGraph: {
    type: "website",
    title: "Aurum — AI Trading Software",
    description:
      "Real-time markets, Groq AI analysis, and an autonomous multi-agent trader. Paper-trading platform.",
    url: siteUrl,
    siteName: "Aurum",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurum — AI Trading Software",
    description: "Real-time markets, Groq AI analysis, and autonomous trading agents.",
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body>
        <div className="app-background" />
        <div className="grid-overlay" />
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
