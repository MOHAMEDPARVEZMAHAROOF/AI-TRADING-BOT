import { AssetTradingWorkspace } from "@/components/trading/AssetTradingWorkspace";
import { CRYPTO_MARKETS } from "@/lib/constants";

export const metadata = {
  title: "Crypto Trading",
};

export default function CryptoPage() {
  return (
    <AssetTradingWorkspace
      market="crypto"
      title="Crypto Trading Desk"
      subtitle="Institutional-grade AI analysis on major digital assets. Deploy the 24/7 live trade bot powered by Aurum’s six-layer agentic stack — it keeps running on our servers until you stop it."
      watchlist={CRYPTO_MARKETS}
      defaultSymbol="BTC-USD"
    />
  );
}
