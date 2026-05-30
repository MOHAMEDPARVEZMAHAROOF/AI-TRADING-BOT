import { AssetTradingWorkspace } from "@/components/trading/AssetTradingWorkspace";
import { FOREX_MARKETS } from "@/lib/constants";

export const metadata = {
  title: "Forex Trading",
};

export default function ForexPage() {
  return (
    <AssetTradingWorkspace
      market="forex"
      title="Forex Trading Desk"
      subtitle="Major currency pairs with live spreads and AI-driven signals. The 24/5 live trade bot follows global FX sessions and pauses on weekends — automatic resume when markets reopen."
      watchlist={FOREX_MARKETS}
      defaultSymbol="EURUSD=X"
    />
  );
}
