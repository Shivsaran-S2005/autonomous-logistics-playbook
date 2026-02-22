import { WorldState } from "@/simulation/types";
import type { ManualScenario } from "@/hooks/useSimulation";

interface DisruptionControlsProps {
  world: WorldState;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onTriggerDisruption: (type: "supplierFailure" | "roadBlock") => void;
  onClearDisruption: (type: "supplierFailure" | "roadBlock") => void;
  onTriggerManualScenario?: (scenario: ManualScenario) => void;
}

const MANUAL_SCENARIOS: { id: ManualScenario; label: string }[] = [
  { id: "stockout", label: "Stockout" },
  { id: "supplier_failure", label: "Supplier Fail" },
  { id: "dual_supplier", label: "Dual Fail" },
  { id: "network_error", label: "Network Error" },
  { id: "cocoa_shortage", label: "Cocoa Shortage" },
  { id: "peanut_contamination", label: "Peanut Contamination" },
];

export function DisruptionControls({
  world,
  onStart,
  onStop,
  onReset,
  onTriggerDisruption,
  onClearDisruption,
  onTriggerManualScenario,
}: DisruptionControlsProps) {
  return (
    <div className="cyber-panel p-4">
      <h2 className="font-display text-sm tracking-widest text-neon-yellow text-glow-yellow mb-3">
        // CONTROL PANEL
      </h2>
      <div className="flex flex-wrap gap-2">
        {!world.running ? (
          <button
            onClick={onStart}
            className="px-4 py-2 border border-neon-green/50 text-neon-green font-mono text-xs tracking-wider 
              hover:bg-neon-green/10 hover:box-glow-cyan transition-all rounded-sm"
          >
            ▶ START
          </button>
        ) : (
          <button
            onClick={onStop}
            className="px-4 py-2 border border-neon-yellow/50 text-neon-yellow font-mono text-xs tracking-wider 
              hover:bg-neon-yellow/10 transition-all rounded-sm"
          >
            ⏸ PAUSE
          </button>
        )}
        <button
          onClick={onReset}
          className="px-4 py-2 border border-muted-foreground/30 text-muted-foreground font-mono text-xs tracking-wider 
            hover:bg-muted/50 transition-all rounded-sm"
        >
          ↺ RESET
        </button>

        <div className="w-px bg-border mx-1" />

        {!world.disruptions.supplierFailure ? (
          <button
            onClick={() => onTriggerDisruption("supplierFailure")}
            className="px-4 py-2 border border-neon-red/50 text-neon-red font-mono text-xs tracking-wider 
              hover:bg-neon-red/10 transition-all rounded-sm"
          >
            🔥 SUPPLIER FAIL
          </button>
        ) : (
          <button
            onClick={() => onClearDisruption("supplierFailure")}
            className="px-4 py-2 border border-neon-green/50 text-neon-green font-mono text-xs tracking-wider 
              hover:bg-neon-green/10 transition-all rounded-sm animate-pulse-glow"
          >
            ✓ RESTORE SUPPLIER
          </button>
        )}

        {!world.disruptions.roadBlock ? (
          <button
            onClick={() => onTriggerDisruption("roadBlock")}
            className="px-4 py-2 border border-neon-orange/50 text-neon-orange font-mono text-xs tracking-wider 
              hover:bg-neon-orange/10 transition-all rounded-sm"
          >
            🚧 ROAD BLOCK
          </button>
        ) : (
          <button
            onClick={() => onClearDisruption("roadBlock")}
            className="px-4 py-2 border border-neon-green/50 text-neon-green font-mono text-xs tracking-wider 
              hover:bg-neon-green/10 transition-all rounded-sm animate-pulse-glow"
          >
            ✓ CLEAR ROAD
          </button>
        )}

        {onTriggerManualScenario && !world.locked && (
          <>
            <div className="w-px bg-border mx-1" />
            <span className="font-mono text-[9px] text-muted-foreground">MANUAL SCENARIOS:</span>
            {MANUAL_SCENARIOS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onTriggerManualScenario(id)}
                className="px-3 py-1.5 border border-neon-magenta/50 text-neon-magenta font-mono text-[9px] tracking-wider 
                  hover:bg-neon-magenta/10 transition-all rounded-sm"
              >
                {label}
              </button>
            ))}
          </>
        )}

        <div className="ml-auto flex items-center gap-2 font-mono text-xs">
          <span className="text-muted-foreground">TICK:</span>
          <span className="text-neon-cyan">{world.tick}</span>
          <span className={`w-2 h-2 rounded-full ${world.running ? "bg-neon-green animate-pulse-glow" : "bg-muted-foreground"}`} />
        </div>
      </div>
    </div>
  );
}
