import { WorldState } from "@/simulation/types";

interface MapGridProps {
  world: WorldState;
}

const GRID_SIZE = 10;

type NodeState = "healthy" | "alert" | "disrupted" | "recovered";

function supplierNodeState(s: { active: boolean; reliability: number }): NodeState {
  if (!s.active) return "disrupted";
  if (s.reliability >= 0.8) return "healthy";
  if (s.reliability >= 0.5) return "recovered";
  return "alert";
}

function warehouseNodeState(fillPct: number): NodeState {
  if (fillPct > 0.5) return "healthy";
  if (fillPct > 0.25) return "alert";
  if (fillPct > 0) return "disrupted";
  return "disrupted";
}

const NODE_COLORS: Record<NodeState, { fill: string; stroke: string }> = {
  healthy: { fill: "hsl(180 100% 50% / 0.2)", stroke: "hsl(180 100% 50%)" },
  alert: { fill: "hsl(45 100% 50% / 0.2)", stroke: "hsl(45 100% 50%)" },
  disrupted: { fill: "hsl(0 100% 50% / 0.2)", stroke: "hsl(0 100% 55%)" },
  recovered: { fill: "hsl(220 100% 60% / 0.2)", stroke: "hsl(220 100% 60%)" },
};

const WH_NODE_COLORS: Record<NodeState, { fill: string; stroke: string }> = {
  healthy: { fill: "hsl(55 100% 50% / 0.25)", stroke: "hsl(55 100% 50%)" },
  alert: { fill: "hsl(45 100% 50% / 0.2)", stroke: "hsl(45 100% 50%)" },
  disrupted: { fill: "hsl(0 100% 50% / 0.2)", stroke: "hsl(0 100% 55%)" },
  recovered: { fill: "hsl(220 100% 60% / 0.2)", stroke: "hsl(220 100% 60%)" },
};

const hasDisruption = (w: WorldState) => w.disruptions.supplierFailure || w.disruptions.roadBlock || w.activeScenario != null;

export function MapGrid({ world }: MapGridProps) {
  const cellSize = 100 / GRID_SIZE;
  const edgeDelayed = world.disruptions.roadBlock;

  return (
    <div className={`cyber-panel p-4 h-full ${hasDisruption(world) ? "ring-2 ring-orange-500/50 rounded animate-pulse-glow" : ""}`}>
      <h2 className="font-display text-sm tracking-widest text-neon-cyan text-glow-cyan mb-3">
        // SUPPLY CHAIN MAP — SUPPLIERS & WAREHOUSES
      </h2>
      <div className="relative w-full aspect-square cyber-grid-bg rounded overflow-hidden border border-neon-cyan/20">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {/* Edges: truck routes — delay style when road block */}
          {world.trucks.filter(t => t.busy && t.target).map(truck => (
            <line
              key={`line_${truck.id}`}
              x1={truck.pos.x * cellSize + cellSize / 2}
              y1={truck.pos.y * cellSize + cellSize / 2}
              x2={truck.target!.x * cellSize + cellSize / 2}
              y2={truck.target!.y * cellSize + cellSize / 2}
              stroke={edgeDelayed ? "hsl(25 100% 50%)" : "hsl(55 100% 50%)"}
              strokeWidth={edgeDelayed ? 0.6 : 0.3}
              strokeDasharray={edgeDelayed ? "4,3" : "2,2"}
              opacity={edgeDelayed ? 0.8 : 0.5}
            />
          ))}

          {/* Suppliers — node state colors */}
          {world.suppliers.map(s => {
            const state = supplierNodeState(s);
            const colors = NODE_COLORS[state];
            return (
              <g key={s.id}>
                <rect
                  x={s.pos.x * cellSize + cellSize * 0.15}
                  y={s.pos.y * cellSize + cellSize * 0.15}
                  width={cellSize * 0.7}
                  height={cellSize * 0.7}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="0.4"
                />
                <text
                  x={s.pos.x * cellSize + cellSize / 2}
                  y={s.pos.y * cellSize + cellSize / 2 + 1}
                  textAnchor="middle"
                  fill={colors.stroke}
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
            );
          })}

          {/* Warehouses — node state by inventory */}
          {world.warehouses.map(wh => {
            const fillPct = wh.inventory / wh.maxInventory;
            const state = warehouseNodeState(fillPct);
            const colors = WH_NODE_COLORS[state];
            return (
              <g key={wh.id}>
                <rect
                  x={wh.pos.x * cellSize + cellSize * 0.1}
                  y={wh.pos.y * cellSize + cellSize * 0.1}
                  width={cellSize * 0.8}
                  height={cellSize * 0.8}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="0.4"
                />
                <rect
                  x={wh.pos.x * cellSize + cellSize * 0.15}
                  y={wh.pos.y * cellSize + cellSize * 0.65}
                  width={cellSize * 0.7 * Math.max(0, fillPct)}
                  height={cellSize * 0.15}
                  fill={fillPct < 0.25 ? "hsl(0 100% 55%)" : "hsl(55 100% 50%)"}
                />
                <text
                  x={wh.pos.x * cellSize + cellSize / 2}
                  y={wh.pos.y * cellSize + cellSize / 2}
                  textAnchor="middle"
                  fill={colors.stroke}
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

        {/* Legend — node states + edges */}
        <div className="absolute bottom-1 left-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono">
          <span className="text-neon-cyan">■ SUP</span>
          <span className="text-neon-yellow">■ WH</span>
          <span className="text-neon-magenta">● RET</span>
          <span className="text-neon-green">● TRK</span>
          <span className="text-orange-400">— delay</span>
        </div>
      </div>
    </div>
  );
}
