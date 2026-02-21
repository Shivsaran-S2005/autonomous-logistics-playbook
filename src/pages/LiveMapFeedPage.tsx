import { useState, useEffect, useRef, useCallback } from "react";
import {
  getLiveFeedEntries,
  addLiveFeedEntry,
  subscribeToUpdates,
  getSupplierById,
  getProductById,
} from "@/data/db";
import { LiveMap } from "@/components/supply-chain/LiveMap";
import { LiveFeedErrors } from "@/components/supply-chain/LiveFeedErrors";
import { enableFromUserGesture, isVoiceEnabled, speakNewError } from "@/lib/voiceAlerts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const REFRESH_MS = 30000;

export default function LiveMapFeedPage() {
  const [, setTick] = useState(0);
  const seenFeedIdsRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const unsub = subscribeToUpdates(refresh);
    const interval = setInterval(refresh, REFRESH_MS);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    const onInteract = () => enableFromUserGesture();
    window.addEventListener("click", onInteract);
    window.addEventListener("keydown", onInteract);
    return () => {
      window.removeEventListener("click", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, []);

  const entries = getLiveFeedEntries();
  useEffect(() => {
    for (const e of entries) {
      if (e.status !== "Active" || seenFeedIdsRef.current.has(e.feedId)) continue;
      seenFeedIdsRef.current.add(e.feedId);
      const supplier = getSupplierById(e.supplierId);
      const productName = e.productName ?? (e.productId ? getProductById(e.productId)?.name : null) ?? "—";
      const details = `Type: ${e.errorType}. Supplier: ${supplier?.name ?? e.supplierId}. Product: ${productName}. Quantity: ${e.quantity ?? "—"}. Message: ${e.message}`;
      speakNewError(details);
    }
  }, [entries]);

  const addSampleError = () => {
    addLiveFeedEntry({
      errorType: "stock_shortage",
      supplierId: "sup_cadbury",
      productId: "prod_gems",
      productName: "Gems",
      category: "confectionery",
      quantity: 50,
      message: "Low stock detected. Gems below reorder level.",
      aiSuggestion: "Reroute to Nestle or Ferrero for same category.",
    });
    toast.success("Sample error added. Map and feed updated.");
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-lg tracking-widest text-neon-cyan text-glow-cyan">
            LIVE MAP — ERROR HANDLING
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Supplier points: Red = Error, Green = Normal. Supply shifts show as flow on map. Actions update status in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isVoiceEnabled() && (
            <Button
              variant="outline"
              size="sm"
              className="font-mono gap-1.5"
              onClick={() =>
                enableFromUserGesture("Voice alerts enabled. You will hear new errors and resolutions.")
              }
            >
              <Volume2 className="w-3.5 h-3.5" />
              Enable voice
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="font-mono gap-1.5"
            onClick={addSampleError}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Add sample error
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-neon-cyan/30">
          <CardHeader className="py-2">
            <CardTitle className="font-display text-xs tracking-widest text-neon-cyan">
              MAP — DYNAMIC STATUS & FLOW
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <LiveMap />
          </CardContent>
        </Card>
        <Card className="border-neon-cyan/30">
          <CardHeader className="py-2">
            <CardTitle className="font-display text-xs tracking-widest text-neon-cyan">
              LIVE FEED — ACTIONS DROPDOWN
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <LiveFeedErrors onRefresh={refresh} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
