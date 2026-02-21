import { useState, useEffect, useCallback, useRef } from "react";
import { WorldState, SimEvent } from "../simulation/types";
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

  const setMode = useCallback((mode: "AUTO_MODE" | "MANUAL_MODE") => {
    setWorld(prev => ({ ...prev, mode }));
  }, []);

  const resolveIssue = useCallback(() => {
    setWorld(prev => {
      const events = [...prev.events];
      const idx = prev.pendingIssue ? events.findIndex(e => e.id === prev.pendingIssue!.id) : -1;
      if (idx >= 0) {
        events[idx] = { ...events[idx], resolvedBy: "manual" as const, severity: "success" as const };
      }
      return {
        ...prev,
        mode: "AUTO_MODE",
        locked: false,
        pendingIssue: null,
        events: [
          {
            id: `evt_resolved_${Date.now()}`,
            timestamp: Date.now(),
            type: "recovery",
            message: "✓ Issue resolved. System unlocked. Resuming AUTO MODE.",
            severity: "success",
          },
          ...events,
        ].slice(0, 50),
      };
    });
  }, []);

  const changeSupplier = useCallback(() => {
    setWorld(prev => {
      const newWorld = { ...prev };
      // Switch to alternative supplier
      const failedSupplier = newWorld.suppliers.find(s => !s.active || s.reliability < 0.5);
      const altSupplier = newWorld.suppliers.find(s => s.id !== failedSupplier?.id && s.reliability > 0.5);
      
      if (failedSupplier && altSupplier) {
        failedSupplier.active = false;
        failedSupplier.reliability = 0.1;
        altSupplier.active = true;
        altSupplier.reliability = Math.min(1.0, altSupplier.reliability + 0.1);
        
        newWorld.events = [
          {
            id: `evt_supplier_change_${Date.now()}`,
            timestamp: Date.now(),
            type: "recovery",
            message: `✓ Supplier changed: ${failedSupplier.name} → ${altSupplier.name}`,
            severity: "success",
          },
          ...newWorld.events,
        ].slice(0, 50);
      }
      
      return newWorld;
    });
  }, []);

  const switchServer = useCallback(() => {
    setWorld(prev => {
      const newWorld = { ...prev };
      // Simulate server switch - reset supplier reliabilities
      newWorld.suppliers.forEach(s => {
        s.reliability = s.baseReliability;
        s.active = true;
      });
      
      newWorld.events = [
        {
          id: `evt_server_switch_${Date.now()}`,
          timestamp: Date.now(),
          type: "recovery",
          message: "✓ Server switched. All suppliers reconnected.",
          severity: "success",
        },
        ...newWorld.events,
      ].slice(0, 50);
      
      return newWorld;
    });
  }, []);

  const retry = useCallback(() => {
    setWorld(prev => {
      const newWorld = { ...prev };
      // Retry auto-fix logic
      const emptyWarehouse = newWorld.warehouses.find(wh => wh.inventory <= 0);
      if (emptyWarehouse) {
        const bestSupplier = newWorld.suppliers
          .filter(s => s.active)
          .sort((a, b) => b.reliability - a.reliability)[0];
        
        if (bestSupplier && bestSupplier.reliability > 0.5) {
          const resupply = 25 + Math.floor(Math.random() * 35);
          emptyWarehouse.inventory = Math.min(emptyWarehouse.maxInventory, emptyWarehouse.inventory + resupply);
          newWorld.events = [
            {
              id: `evt_retry_success_${Date.now()}`,
              timestamp: Date.now(),
              type: "recovery",
              message: `✓ Retry successful: ${emptyWarehouse.name} resupplied (+${resupply} units)`,
              severity: "success",
            },
            ...newWorld.events,
          ].slice(0, 50);
        } else {
          newWorld.events = [
            {
              id: `evt_retry_failed_${Date.now()}`,
              timestamp: Date.now(),
              type: "alert",
              message: "⚠ Retry failed: No available suppliers",
              severity: "warning",
            },
            ...newWorld.events,
          ].slice(0, 50);
        }
      }
      
      return newWorld;
    });
  }, []);

  /** Injects a manual-resolution scenario for testing. AI cannot resolve these. */
  const triggerManualScenario = useCallback((scenario: "stockout" | "supplier_failure" | "dual_supplier" | "network_error") => {
    setWorld(prev => {
      const ts = Date.now();
      const scenarios = {
        stockout: {
          pendingIssue: {
            id: `evt_manual_stockout_${ts}`,
            timestamp: ts,
            type: "alert" as const,
            message: "⚠ STOCKOUT: VAULT ALPHA empty! AI auto-fix failed.",
            severity: "critical" as const,
          },
          events: [
            { id: `evt_manual_${ts}`, timestamp: ts, type: "alert" as const, message: "⚠ STOCKOUT: VAULT ALPHA empty!", severity: "critical" as const },
            { id: `evt_lock_${ts}`, timestamp: ts, type: "alert" as const, message: "🔒 SYSTEM LOCKED: Auto-fix failed. Manual intervention required.", severity: "critical" as const },
          ],
          worldChanges: (w: WorldState) => {
            w.warehouses = w.warehouses.map(wh => wh.id === "wh_1" ? { ...wh, inventory: 0 } : wh);
          },
        },
        supplier_failure: {
          pendingIssue: {
            id: `evt_manual_supplier_${ts}`,
            timestamp: ts,
            type: "disruption" as const,
            message: "🔥 CRITICAL: NEXUS CORP supplier has FAILED — No alternative available",
            severity: "critical" as const,
          },
          events: [
            { id: `evt_manual_${ts}`, timestamp: ts, type: "disruption" as const, message: "🔥 CRITICAL: NEXUS CORP supplier has FAILED", severity: "critical" as const },
            { id: `evt_lock_${ts}`, timestamp: ts, type: "alert" as const, message: "🔒 SYSTEM LOCKED: Auto-reroute failed. Manual intervention required.", severity: "critical" as const },
          ],
          worldChanges: (w: WorldState) => {
            w.disruptions = { ...w.disruptions, supplierFailure: true };
            w.suppliers = w.suppliers.map((s, i) => i === 0 ? { ...s, active: false, reliability: 0.1 } : s);
          },
        },
        dual_supplier: {
          pendingIssue: {
            id: `evt_manual_dual_${ts}`,
            timestamp: ts,
            type: "disruption" as const,
            message: "🔥 CRITICAL: All suppliers offline — Dual failure detected",
            severity: "critical" as const,
          },
          events: [
            { id: `evt_manual_${ts}`, timestamp: ts, type: "disruption" as const, message: "🔥 CRITICAL: NEXUS CORP and CYBERTEK both FAILED", severity: "critical" as const },
            { id: `evt_lock_${ts}`, timestamp: ts, type: "alert" as const, message: "🔒 SYSTEM LOCKED: No suppliers available. Manual intervention required.", severity: "critical" as const },
          ],
          worldChanges: (w: WorldState) => {
            w.disruptions = { ...w.disruptions, supplierFailure: true };
            w.suppliers = w.suppliers.map(s => ({ ...s, active: false, reliability: 0.1 }));
          },
        },
        network_error: {
          pendingIssue: {
            id: `evt_manual_network_${ts}`,
            timestamp: ts,
            type: "alert" as const,
            message: "⚠ NETWORK ERROR: AI coordination server unreachable",
            severity: "critical" as const,
          },
          events: [
            { id: `evt_manual_${ts}`, timestamp: ts, type: "alert" as const, message: "⚠ NETWORK ERROR: AI coordination server unreachable", severity: "critical" as const },
            { id: `evt_lock_${ts}`, timestamp: ts, type: "alert" as const, message: "🔒 SYSTEM LOCKED: Manual intervention required.", severity: "critical" as const },
          ],
          worldChanges: () => {},
        },
      };
      const s = scenarios[scenario];
      const newWorld: WorldState = JSON.parse(JSON.stringify(prev));
      s.worldChanges(newWorld);
      newWorld.mode = "MANUAL_MODE";
      newWorld.locked = true;
      newWorld.pendingIssue = s.pendingIssue;
      newWorld.events = [...s.events, ...prev.events].slice(0, 50);
      return newWorld;
    });
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

  // 40-second manual error cycle: force one ERROR, skip AI, switch to MANUAL_MODE and lock
  const manualCycleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!world.running) {
      if (manualCycleIntervalRef.current) {
        clearInterval(manualCycleIntervalRef.current);
        manualCycleIntervalRef.current = null;
      }
      return () => {
        if (manualCycleIntervalRef.current) clearInterval(manualCycleIntervalRef.current);
      };
    }
    manualCycleIntervalRef.current = setInterval(() => {
      setWorld(prev => {
        if (prev.mode !== "AUTO_MODE" || prev.locked) return prev;
        const evt: SimEvent = {
          id: `evt_manual_40s_${Date.now()}`,
          timestamp: Date.now(),
          type: "alert",
          message: "Manual intervention required.",
          severity: "critical",
        };
        return {
          ...prev,
          mode: "MANUAL_MODE",
          locked: true,
          pendingIssue: evt,
          events: [evt, ...prev.events].slice(0, 50),
        };
      });
    }, 40000);
    return () => {
      if (manualCycleIntervalRef.current) {
        clearInterval(manualCycleIntervalRef.current);
        manualCycleIntervalRef.current = null;
      }
    };
  }, [world.running]);

  return { 
    world, 
    start, 
    stop, 
    reset, 
    triggerDisruption, 
    clearDisruption,
    triggerManualScenario,
    setMode,
    resolveIssue,
    changeSupplier,
    switchServer,
    retry,
  };
}
