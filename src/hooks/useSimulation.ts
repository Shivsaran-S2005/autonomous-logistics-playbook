import { useState, useEffect, useCallback, useRef } from "react";
import { WorldState, SimEvent, InternalTransfer } from "../simulation/types";
import { createInitialWorld, simulateTick } from "../simulation/engine";
import { addGovernanceEntry } from "@/lib/governanceLog";

const ARES_WORLD_STORAGE_KEY = "ares_world_state";

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function loadPersistedWorld(): WorldState | null {
  try {
    const raw = localStorage.getItem(ARES_WORLD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorldState;
    if (!parsed || !parsed.suppliers?.length) return null;
    return { ...parsed, running: false } as WorldState;
  } catch {
    return null;
  }
}

export type ManualScenario =
  | "stockout"
  | "supplier_failure"
  | "dual_supplier"
  | "network_error"
  | "cocoa_shortage"
  | "peanut_contamination";

export function useSimulation() {
  const [world, setWorld] = useState<WorldState>(() => loadPersistedWorld() ?? createInitialWorld());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    setWorld(prev => ({ ...prev, running: true }));
  }, []);

  const stop = useCallback(() => {
    setWorld(prev => ({ ...prev, running: false }));
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setWorld(createInitialWorld());
    addGovernanceEntry("reset", "Simulation reset to initial state.");
  }, []);

  const setMode = useCallback((mode: "AUTO_MODE" | "MANUAL_MODE") => {
    setWorld(prev => {
      addGovernanceEntry("mode_change", `Mode set to ${mode}.`, {});
      return { ...prev, mode };
    });
  }, []);

  const dispatchTransfer = useCallback((
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    requestId?: string
  ) => {
    const transfer: InternalTransfer = {
      id: uid("trans"),
      fromWarehouseId,
      toWarehouseId,
      quantity,
      status: "pending",
      requestId,
    };
    setWorld(prev => ({
      ...prev,
      transfers: [...(prev.transfers || []), transfer],
    }));
  }, []);

  const resolveIssue = useCallback(() => {
    setWorld(prev => {
      const events = [...prev.events];
      const idx = prev.pendingIssue ? events.findIndex(e => e.id === prev.pendingIssue!.id) : -1;
      if (idx >= 0) {
        events[idx] = { ...events[idx], resolvedBy: "manual" as const, severity: "success" as const };
      }
      addGovernanceEntry("manual_resolve", "Manual intervention: issue resolved, system unlocked.", { refId: prev.pendingIssue?.id });
      return {
        ...prev,
        mode: "AUTO_MODE",
        locked: false,
        pendingIssue: null,
        activeScenario: undefined,
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
  const triggerManualScenario = useCallback((scenario: ManualScenario) => {
    addGovernanceEntry("scenario_trigger", `Scenario triggered: ${scenario}.`, {});
    setWorld(prev => {
      const ts = Date.now();
      const scenarios: Record<
        ManualScenario,
        {
          pendingIssue: SimEvent;
          events: SimEvent[];
          worldChanges: (w: WorldState) => void;
          activeScenario?: WorldState["activeScenario"];
        }
      > = {
        stockout: {
          pendingIssue: {
            id: `evt_manual_stockout_${ts}`,
            timestamp: ts,
            type: "alert",
            message: "⚠ STOCKOUT: VAULT ALPHA empty! AI auto-fix failed.",
            severity: "critical",
          },
          events: [
            { id: `evt_manual_${ts}`, timestamp: ts, type: "alert", message: "⚠ STOCKOUT: VAULT ALPHA empty!", severity: "critical" },
            { id: `evt_lock_${ts}`, timestamp: ts, type: "alert", message: "🔒 SYSTEM LOCKED: Auto-fix failed. Manual intervention required.", severity: "critical" },
          ],
          worldChanges: (w: WorldState) => {
            w.warehouses = w.warehouses.map(wh => wh.id === "wh_1" ? { ...wh, inventory: 0 } : wh);
          },
        },
        supplier_failure: {
          pendingIssue: {
            id: `evt_manual_supplier_${ts}`,
            timestamp: ts,
            type: "disruption",
            message: "🔥 CRITICAL: Cadbury supplier has FAILED — No alternative available",
            severity: "critical",
          },
          events: [
            { id: `evt_manual_${ts}`, timestamp: ts, type: "disruption", message: "🔥 CRITICAL: Cadbury supplier has FAILED", severity: "critical" },
            { id: `evt_lock_${ts}`, timestamp: ts, type: "alert", message: "🔒 SYSTEM LOCKED: Auto-reroute failed. Manual intervention required.", severity: "critical" },
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
            type: "disruption",
            message: "🔥 CRITICAL: All suppliers offline — Dual failure detected",
            severity: "critical",
          },
          events: [
            { id: `evt_manual_${ts}`, timestamp: ts, type: "disruption", message: "🔥 CRITICAL: Cadbury supplier has FAILED", severity: "critical" },
            { id: `evt_lock_${ts}`, timestamp: ts, type: "alert", message: "🔒 SYSTEM LOCKED: No suppliers available. Manual intervention required.", severity: "critical" },
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
            type: "alert",
            message: "⚠ NETWORK ERROR: AI coordination server unreachable",
            severity: "critical",
          },
          events: [
            { id: `evt_manual_${ts}`, timestamp: ts, type: "alert", message: "⚠ NETWORK ERROR: AI coordination server unreachable", severity: "critical" },
            { id: `evt_lock_${ts}`, timestamp: ts, type: "alert", message: "🔒 SYSTEM LOCKED: Manual intervention required.", severity: "critical" },
          ],
          worldChanges: () => {},
        },
        cocoa_shortage: {
          pendingIssue: {
            id: `evt_cocoa_${ts}`,
            timestamp: ts,
            type: "disruption",
            message: "🍫 COCOA SHORTAGE: Cadbury (Cocoa Agent) supply disrupted — manual allocation required.",
            severity: "critical",
          },
          events: [
            { id: `evt_cocoa_${ts}`, timestamp: ts, type: "disruption", message: "🍫 COCOA SHORTAGE: Cadbury cocoa supply disrupted. Cocoa Agent escalated.", severity: "critical" },
            { id: `evt_lock_cocoa_${ts}`, timestamp: ts, type: "alert", message: "🔒 SYSTEM LOCKED: Resolve Cocoa Shortage (e.g. allocate from Nestle/Ferrero).", severity: "critical" },
          ],
          activeScenario: "cocoa_shortage",
          worldChanges: (w: WorldState) => {
            w.disruptions = { ...w.disruptions, supplierFailure: true };
            w.suppliers = w.suppliers.map((s, i) => i === 0 ? { ...s, active: false, reliability: 0.1 } : s);
          },
        },
        peanut_contamination: {
          pendingIssue: {
            id: `evt_peanut_${ts}`,
            timestamp: ts,
            type: "disruption",
            message: "🥜 PEANUT CONTAMINATION: Recall in progress — Peanut Agent isolated affected batch.",
            severity: "critical",
          },
          events: [
            { id: `evt_peanut_${ts}`, timestamp: ts, type: "disruption", message: "🥜 PEANUT CONTAMINATION: Peanut Agent triggered recall. Affected supplier link paused.", severity: "critical" },
            { id: `evt_lock_peanut_${ts}`, timestamp: ts, type: "alert", message: "🔒 SYSTEM LOCKED: Confirm recall completion and clear Peanut Contamination.", severity: "critical" },
          ],
          activeScenario: "peanut_contamination",
          worldChanges: (w: WorldState) => {
            w.disruptions = { ...w.disruptions, roadBlock: true };
            const mars = w.suppliers.find(s => s.name === "Mars");
            if (mars) {
              mars.active = false;
              mars.reliability = 0.2;
            }
          },
        },
      };
      const s = scenarios[scenario];
      const newWorld: WorldState = JSON.parse(JSON.stringify(prev));
      s.worldChanges(newWorld);
      newWorld.mode = "MANUAL_MODE";
      newWorld.locked = true;
      newWorld.pendingIssue = s.pendingIssue;
      newWorld.events = [...s.events, ...prev.events].slice(0, 50);
      if (s.activeScenario) newWorld.activeScenario = s.activeScenario;
      return newWorld;
    });
  }, []);

  const triggerDisruption = useCallback((type: "supplierFailure" | "roadBlock") => {
    addGovernanceEntry("disruption_trigger", type === "supplierFailure" ? "Supplier failure triggered." : "Road block triggered.", {});
    setWorld(prev => ({
      ...prev,
      disruptions: { ...prev.disruptions, [type]: true },
      events: [
        {
          id: `evt_dis_${Date.now()}`,
          timestamp: Date.now(),
          type: "disruption" as const,
          message: type === "supplierFailure"
            ? "🔥 CRITICAL: Cadbury supplier has FAILED"
            : "🚧 CRITICAL: Road blockage detected — transport delayed",
          severity: "critical" as const,
        },
        ...prev.events,
      ].slice(0, 50),
    }));
  }, []);

  const clearDisruption = useCallback((type: "supplierFailure" | "roadBlock") => {
    addGovernanceEntry("disruption_clear", type === "supplierFailure" ? "Supplier restored." : "Road block cleared.", {});
    setWorld(prev => {
      const next = {
        ...prev,
        disruptions: { ...prev.disruptions, [type]: false },
        events: [
          {
            id: `evt_rec_${Date.now()}`,
            timestamp: Date.now(),
            type: "recovery" as const,
            message: type === "supplierFailure"
              ? "✓ Cadbury supplier recovered"
              : "✓ Road blockage cleared",
            severity: "success" as const,
          },
          ...prev.events,
        ].slice(0, 50),
      };
      if (prev.activeScenario && type === "supplierFailure") next.activeScenario = null;
      if (prev.activeScenario === "peanut_contamination" && type === "roadBlock") next.activeScenario = null;
      return next;
    });
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

  // Persist world to localStorage when not running (debounced)
  useEffect(() => {
    if (world.running) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(ARES_WORLD_STORAGE_KEY, JSON.stringify(world));
      } catch {
        // ignore quota
      }
      saveTimeoutRef.current = null;
    }, 500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [world]);

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
    dispatchTransfer,
  };
}
