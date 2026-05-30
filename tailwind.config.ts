import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0f",
          secondary: "#0f0f1a",
        },
        gold: {
          primary: "#FFD700",
          secondary: "#FFC200",
          accent: "#FFAA00",
          dim: "rgba(255, 215, 0, 0.6)",
        },
        profit: "#00FF88",
        loss: "#FF4466",
        info: "#4488FF",
        agent: "#AA66FF",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        "gold-glow": "0 0 20px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.1)",
        card: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 215, 0, 0.1)",
      },
      keyframes: {
        "blob-float": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.95)" },
        },
        "pulse-gold": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(255,215,0,0.4)" },
          "50%": { opacity: "0.7", boxShadow: "0 0 0 8px rgba(255,215,0,0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "blob-float": "blob-float 18s ease-in-out infinite",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
