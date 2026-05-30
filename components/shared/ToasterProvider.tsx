"use client";

import { Toaster } from "react-hot-toast";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "rgba(15, 15, 26, 0.9)",
          backdropFilter: "blur(20px)",
          color: "#fff",
          border: "1px solid rgba(255, 215, 0, 0.25)",
          borderRadius: "12px",
          fontSize: "14px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        },
        success: { iconTheme: { primary: "#FFD700", secondary: "#0a0a0f" } },
        error: { iconTheme: { primary: "#FF4466", secondary: "#0a0a0f" } },
      }}
    />
  );
}
