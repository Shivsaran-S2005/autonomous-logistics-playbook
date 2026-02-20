import { useState, useEffect, useCallback, useRef } from "react";
import { WorldState } from "../simulation/types";
import { createInitialWorld, simulateTick } from "../simulation/engine";

export function useSimulation() {
  const [world, setWorld] = useState<WorldState>(createInitialWorld);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setWorld(prev => ({ ...prev, running: true }));
  }, []);

  const stop = useCallback(() => {
    setWorld(prev => ({ ...prev, running: false }));
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setWorld(createInitialWorld());
  }, []);

  const triggerDisruption = useCallback((type: "supplierFailure" | "roadBlock") => {
    setWorld(prev => ({
      ...prev,
      disruptions: { ...prev.disruptions, [type]: true },
      events: [
        {
          id: `evt_dis_${Date.now()}`,
          timestamp: Date.now(),
          type: "disruption" as const,
          message: type === "supplierFailure"
            ? "🔥 CRITICAL: NEXUS CORP supplier has FAILED"
            : "🚧 CRITICAL: Road blockage detected — transport delayed",
          severity: "critical" as const,
        },
        ...prev.events,
      ].slice(0, 50),
    }));
  }, []);

  const clearDisruption = useCallback((type: "supplierFailure" | "roadBlock") => {
    setWorld(prev => ({
      ...prev,
      disruptions: { ...prev.disruptions, [type]: false },
      events: [
        {
          id: `evt_rec_${Date.now()}`,
          timestamp: Date.now(),
          type: "recovery" as const,
          message: type === "supplierFailure"
            ? "✓ Supplier NEXUS CORP recovered"
            : "✓ Road blockage cleared",
          severity: "success" as const,
        },
        ...prev.events,
      ].slice(0, 50),
    }));
  }, []);

  useEffect(() => {
    if (world.running) {
      intervalRef.current = setInterval(() => {
        setWorld(prev => simulateTick(prev));
      }, 800);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [world.running]);

  return { world, start, stop, reset, triggerDisruption, clearDisruption };
}
