import { useState, useEffect } from "react";
import {
  getConsumerDeliveryViews,
  getRetailerDeliveryViews,
  subscribeToUpdates,
} from "@/data/db";
import type { ConsumerDeliveryView } from "@/data/types";
import type { RetailerDeliveryView } from "@/data/types";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

const REFRESH_INTERVAL_MS = 45_000; // 45 seconds

export function LiveDeliveryFeed() {
  const { role, retailer } = useAuth();
  const [consumerViews, setConsumerViews] = useState<ConsumerDeliveryView[]>(() =>
    role === "consumer" ? getConsumerDeliveryViews() : []
  );
  const [retailerViews, setRetailerViews] = useState<RetailerDeliveryView[]>(() =>
    role === "retailer" && retailer ? getRetailerDeliveryViews(retailer.retailerId) : []
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  const refresh = () => {
    if (role === "consumer") {
      setConsumerViews(getConsumerDeliveryViews());
    } else if (role === "retailer" && retailer) {
      setRetailerViews(getRetailerDeliveryViews(retailer.retailerId));
    }
    setLastUpdated(new Date());
  };

  useEffect(() => {
    refresh();
    const unsub = subscribeToUpdates(refresh);
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      unsub();
      clearInterval(id);
    };
  }, [role, retailer?.retailerId]);

  if (role === "consumer") {
    return (
      <Card className="border-neon-cyan/30">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="font-display text-xs tracking-widest text-neon-cyan">
            LIVE DELIVERY STATUS
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
            <button type="button" onClick={refresh} className="text-muted-foreground hover:text-primary">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-[10px] text-muted-foreground font-mono mb-3">
            High-level status for all products. Updates every ~45s.
          </p>
          <ul className="space-y-2">
            {consumerViews.map((v) => (
              <li key={v.deliveryId} className="flex flex-wrap items-center gap-2 font-mono text-xs border-b border-border/50 pb-2">
                <span className="text-primary font-medium">{v.productName}</span>
                <Badge variant="outline" className="text-[10px]">
                  {v.status}
                </Badge>
                <span className="text-muted-foreground">
                  ETA: {new Date(v.estimatedArrival).toLocaleString()}
                </span>
              </li>
            ))}
            {consumerViews.length === 0 && (
              <li className="text-muted-foreground font-mono text-xs">No deliveries in feed.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    );
  }

  // Retailer: detailed tracking
  return (
    <Card className="border-neon-cyan/30">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-xs tracking-widest text-neon-cyan">
          LIVE TRACKING — YOUR DELIVERIES
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
          <button type="button" onClick={refresh} className="text-muted-foreground hover:text-primary">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-[10px] text-muted-foreground font-mono mb-3">
          Shipment ID, batch, location, ETA. Updates every ~45s.
        </p>
        <ul className="space-y-4">
          {retailerViews.map((v) => (
            <li key={v.deliveryId} className="border border-border rounded-md p-3 font-mono text-xs space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-primary">{v.productName}</span>
                <Badge variant={v.status === "delayed" ? "destructive" : "secondary"}>
                  {v.status}
                </Badge>
              </div>
              <div className="text-muted-foreground">
                Shipment: {v.shipmentId} · Batch: {v.productBatch}
              </div>
              <div>Location: {v.currentLocation}</div>
              <div>ETA: {new Date(v.eta).toLocaleString()} · Qty: {v.remainingQuantity}</div>
              {v.history.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[10px]">History</summary>
                  <ul className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
                    {v.history.slice(-5).reverse().map((h, i) => (
                      <li key={i}>
                        {new Date(h.timestamp).toLocaleString()} — {h.location} ({h.status})
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
          {retailerViews.length === 0 && (
            <li className="text-muted-foreground font-mono text-xs">No authorized deliveries.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
