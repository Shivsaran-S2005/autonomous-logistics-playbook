import { WorldState } from "@/simulation/types";

interface MapGridProps {
  world: WorldState;
}

const GRID_SIZE = 10;

export function MapGrid({ world }: MapGridProps) {
  const cellSize = 100 / GRID_SIZE;

  return (
    <div className="cyber-panel p-4 h-full">
      <h2 className="font-display text-sm tracking-widest text-neon-cyan text-glow-cyan mb-3">
        // SUPPLY CHAIN MAP
      </h2>
      <div className="relative w-full aspect-square cyber-grid-bg rounded overflow-hidden border border-neon-cyan/20">
        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {/* Connection lines for busy trucks */}
          {world.trucks.filter(t => t.busy && t.target).map(truck => (
            <line
              key={`line_${truck.id}`}
              x1={truck.pos.x * cellSize + cellSize / 2}
              y1={truck.pos.y * cellSize + cellSize / 2}
              x2={truck.target!.x * cellSize + cellSize / 2}
              y2={truck.target!.y * cellSize + cellSize / 2}
              stroke="hsl(55 100% 50%)"
              strokeWidth="0.3"
              strokeDasharray="2,2"
              opacity="0.5"
            />
          ))}

          {/* Suppliers */}
          {world.suppliers.map(s => (
            <g key={s.id}>
              <rect
                x={s.pos.x * cellSize + cellSize * 0.15}
                y={s.pos.y * cellSize + cellSize * 0.15}
                width={cellSize * 0.7}
                height={cellSize * 0.7}
                fill={s.active ? "hsl(180 100% 50% / 0.15)" : "hsl(0 100% 50% / 0.15)"}
                stroke={s.active ? "hsl(180 100% 50%)" : "hsl(0 100% 50%)"}
                strokeWidth="0.4"
              />
              <text
                x={s.pos.x * cellSize + cellSize / 2}
                y={s.pos.y * cellSize + cellSize / 2 + 1}
                textAnchor="middle"
                fill={s.active ? "hsl(180 100% 50%)" : "hsl(0 100% 55%)"}
                fontSize="2.5"
                fontFamily="monospace"
              >
                SUP
              </text>
              <text
                x={s.pos.x * cellSize + cellSize / 2}
                y={s.pos.y * cellSize + cellSize + 1}
                textAnchor="middle"
                fill="hsl(180 60% 70%)"
                fontSize="1.8"
                fontFamily="monospace"
              >
                {s.name}
              </text>
            </g>
          ))}

          {/* Warehouses */}
          {world.warehouses.map(wh => {
            const fillPct = wh.inventory / wh.maxInventory;
            return (
              <g key={wh.id}>
                <rect
                  x={wh.pos.x * cellSize + cellSize * 0.1}
                  y={wh.pos.y * cellSize + cellSize * 0.1}
                  width={cellSize * 0.8}
                  height={cellSize * 0.8}
                  fill={`hsl(55 100% 50% / ${0.1 + fillPct * 0.2})`}
                  stroke="hsl(55 100% 50%)"
                  strokeWidth="0.4"
                />
                {/* Inventory fill bar */}
                <rect
                  x={wh.pos.x * cellSize + cellSize * 0.15}
                  y={wh.pos.y * cellSize + cellSize * 0.65}
                  width={cellSize * 0.7 * fillPct}
                  height={cellSize * 0.15}
                  fill={fillPct < 0.25 ? "hsl(0 100% 55%)" : "hsl(55 100% 50%)"}
                />
                <text
                  x={wh.pos.x * cellSize + cellSize / 2}
                  y={wh.pos.y * cellSize + cellSize / 2}
                  textAnchor="middle"
                  fill="hsl(55 100% 60%)"
                  fontSize="2.5"
                  fontFamily="monospace"
                >
                  WH
                </text>
              </g>
            );
          })}

          {/* Retailers */}
          {world.retailers.map(r => (
            <g key={r.id}>
              <circle
                cx={r.pos.x * cellSize + cellSize / 2}
                cy={r.pos.y * cellSize + cellSize / 2}
                r={cellSize * 0.35}
                fill="hsl(330 100% 50% / 0.15)"
                stroke="hsl(330 100% 50%)"
                strokeWidth="0.4"
              />
              <text
                x={r.pos.x * cellSize + cellSize / 2}
                y={r.pos.y * cellSize + cellSize / 2 + 1}
                textAnchor="middle"
                fill="hsl(330 100% 60%)"
                fontSize="2"
                fontFamily="monospace"
              >
                RET
              </text>
              <text
                x={r.pos.x * cellSize + cellSize / 2}
                y={r.pos.y * cellSize + cellSize + 1}
                textAnchor="middle"
                fill="hsl(330 60% 70%)"
                fontSize="1.6"
                fontFamily="monospace"
              >
                {r.name}
              </text>
            </g>
          ))}

          {/* Trucks */}
          {world.trucks.map(truck => (
            <g key={truck.id}>
              <circle
                cx={truck.pos.x * cellSize + cellSize / 2}
                cy={truck.pos.y * cellSize + cellSize / 2}
                r={cellSize * 0.22}
                fill={truck.busy ? "hsl(120 100% 45% / 0.8)" : "hsl(120 100% 45% / 0.3)"}
                stroke="hsl(120 100% 45%)"
                strokeWidth="0.3"
                className={truck.busy ? "animate-truck-pulse" : ""}
              />
              <text
                x={truck.pos.x * cellSize + cellSize / 2}
                y={truck.pos.y * cellSize + cellSize / 2 + 0.8}
                textAnchor="middle"
                fill="hsl(0 0% 100%)"
                fontSize="1.6"
                fontFamily="monospace"
              >
                {truck.id.slice(-2)}
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-1 left-1 flex gap-3 text-[10px] font-mono">
          <span className="text-neon-cyan">■ SUP</span>
          <span className="text-neon-yellow">■ WH</span>
          <span className="text-neon-magenta">● RET</span>
          <span className="text-neon-green">● TRK</span>
        </div>
      </div>
    </div>
  );
}
