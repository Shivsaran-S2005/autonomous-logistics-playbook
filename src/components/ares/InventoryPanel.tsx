import { WorldState } from "@/simulation/types";

interface InventoryPanelProps {
  world: WorldState;
}

export function InventoryPanel({ world }: InventoryPanelProps) {
  return (
    <div className="cyber-panel p-4">
      <h2 className="font-display text-sm tracking-widest text-neon-yellow text-glow-yellow mb-3">
        // INVENTORY STATUS
      </h2>
      <div className="space-y-4">
        {world.warehouses.map(wh => {
          const pct = Math.round((wh.inventory / wh.maxInventory) * 100);
          const isCritical = pct < 25;
          const isLow = pct < 50;
          return (
            <div key={wh.id} className="space-y-1.5">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-card-foreground">{wh.name}</span>
                <span className={isCritical ? "text-neon-red text-glow-red" : isLow ? "text-neon-orange" : "text-neon-green"}>
                  {Math.round(wh.inventory)} / {wh.maxInventory}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-sm overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: isCritical
                      ? "hsl(0 100% 55%)"
                      : isLow
                      ? "hsl(25 100% 55%)"
                      : "hsl(120 100% 45%)",
                    boxShadow: isCritical
                      ? "0 0 8px hsl(0 100% 55% / 0.6)"
                      : "none",
                  }}
                />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>Demand rate: {wh.demandRate}/tick</span>
                <span>{pct}%</span>
              </div>
            </div>
          );
        })}

        <div className="border-t border-border pt-3 mt-3">
          <h3 className="font-display text-xs tracking-widest text-neon-cyan mb-2">SUPPLIERS</h3>
          {world.suppliers.map(s => (
            <div key={s.id} className="flex justify-between items-center font-mono text-xs mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${s.active ? "bg-neon-green" : "bg-neon-red animate-pulse-glow"}`} />
                <span className="text-card-foreground">{s.name}</span>
              </div>
              <span className={s.active ? "text-neon-green" : "text-neon-red text-glow-red"}>
                {(s.reliability * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
