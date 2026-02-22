import { useSimulationContext } from "@/contexts/SimulationContext";
import { MapGrid } from "@/components/ares/MapGrid";

export default function NetworkViewPage() {
  const { world } = useSimulationContext();

  return (
    <div className="flex flex-col h-full">
      <h1 className="font-display text-xl tracking-widest text-neon-cyan text-glow-cyan mb-3">
        // NETWORK VIEW — TOPOLOGY
      </h1>
      <p className="font-mono text-[10px] text-muted-foreground mb-2">
        Node states: Healthy (green/cyan) · Alert (yellow) · Disrupted (red) · Recovered (blue). Edges show delay when road block active.
      </p>
      <div className="flex-1 min-h-[400px]">
        <MapGrid world={world} />
      </div>
    </div>
  );
}
