import type { ScanResult } from "@/lib/types";

/**
 * Client-side helper that asks the server to scan a batch of symbols and score them.
 */
export async function scanMarket(symbols: string[]): Promise<{
  scanned: ScanResult[];
  top: ScanResult[];
  scannedCount: number;
}> {
  const res = await fetch("/api/agents/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbols }),
  });
  if (!res.ok) {
    throw new Error(`Scan failed (${res.status})`);
  }
  return res.json();
}
