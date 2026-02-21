import { createContext, useContext, ReactNode } from "react";
import { useSimulation } from "@/hooks/useSimulation";
import { WorldState } from "@/simulation/types";

interface SimulationContextType {
  world: WorldState;
  start: () => void;
  stop: () => void;
  reset: () => void;
  triggerDisruption: (type: "supplierFailure" | "roadBlock") => void;
  clearDisruption: (type: "supplierFailure" | "roadBlock") => void;
  triggerManualScenario: (scenario: "stockout" | "supplier_failure" | "dual_supplier" | "network_error") => void;
  setMode: (mode: "AUTO_MODE" | "MANUAL_MODE") => void;
  resolveIssue: () => void;
  changeSupplier: () => void;
  switchServer: () => void;
  retry: () => void;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const sim = useSimulation();
  return (
    <SimulationContext.Provider value={sim}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulationContext() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulationContext must be used within SimulationProvider");
  return ctx;
}
