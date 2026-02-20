import { WorldState } from "@/simulation/types";

interface TruckStatusProps {
  world: WorldState;
}

export function TruckStatus({ world }: TruckStatusProps) {
  return (
    <div className="cyber-panel p-4">
      <h2 className="font-display text-sm tracking-widest text-neon-green text-glow-green mb-3">
        // FLEET STATUS
      </h2>
      <div className="space-y-2">
        {world.trucks.map(truck => (
          <div key={truck.id} className="flex items-center gap-3 font-mono text-xs">
            <div className={`w-2 h-2 rounded-full ${truck.busy ? "bg-neon-yellow animate-truck-pulse" : "bg-neon-green"}`} />
            <span className="text-card-foreground w-14">{truck.id}</span>
            <span className={`flex-1 truncate ${truck.busy ? "text-neon-yellow" : "text-muted-foreground"}`}>
              {truck.busy ? truck.route || "En route" : "Idle"}
            </span>
            {truck.cargo > 0 && (
              <span className="text-neon-cyan text-[10px]">{truck.cargo}u</span>
            )}
            <span className="text-muted-foreground text-[10px]">
              ({truck.pos.x.toFixed(1)},{truck.pos.y.toFixed(1)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
