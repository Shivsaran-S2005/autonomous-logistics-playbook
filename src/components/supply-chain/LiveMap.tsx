import { getSuppliers, getSupplierIdsWithActiveErrors, getRecentSupplyShifts } from "@/data/db";
import type { SupplyShift } from "@/data/types";

const MAP_SIZE = 400;

function getPos(s: { locationCoordinates?: { x: number; y: number } }) {
  const loc = s.locationCoordinates ?? { x: 50, y: 50 };
  return {
    x: (loc.x / 100) * MAP_SIZE,
    y: (loc.y / 100) * MAP_SIZE,
  };
}

export function LiveMap() {
  const suppliers = getSuppliers();
  const errorSupplierIds = getSupplierIdsWithActiveErrors();
  const shifts = getRecentSupplyShifts();

  const supplierPositions = new Map<string, { x: number; y: number }>();
  for (const s of suppliers) {
    supplierPositions.set(s.supplierId, getPos(s));
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="font-mono text-xs font-medium text-neon-cyan">LIVE MAP — SUPPLIER STATUS</h3>
        <div className="flex gap-3 text-[10px] font-mono">
          <span className="text-red-500">● Error</span>
          <span className="text-emerald-500">● Normal</span>
        </div>
      </div>
      <div className="relative" style={{ width: MAP_SIZE, height: MAP_SIZE }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} className="block">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(55 100% 50%)" />
            </marker>
            <marker
              id="arrowhead-green"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(142 76% 36%)" />
            </marker>
          </defs>

          {/* Grid */}
          {Array.from({ length: 6 }).map((_, i) => (
            <line
              key={`gx-${i}`}
              x1={(i * MAP_SIZE) / 5}
              y1={0}
              x2={(i * MAP_SIZE) / 5}
              y2={MAP_SIZE}
              stroke="hsl(0 0% 30%)"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line
              key={`gy-${i}`}
              x1={0}
              y1={(i * MAP_SIZE) / 5}
              x2={MAP_SIZE}
              y2={(i * MAP_SIZE) / 5}
              stroke="hsl(0 0% 30%)"
              strokeWidth="0.5"
            />
          ))}

          {/* Flow lines (Supplier 1 → Supplier 2) */}
          {shifts.map((shift: SupplyShift) => {
            const from = supplierPositions.get(shift.fromSupplierId);
            const to = supplierPositions.get(shift.toSupplierId);
            if (!from || !to) return null;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            return (
              <g key={shift.shiftId}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="hsl(55 100% 50% / 0.8)"
                  strokeWidth="3"
                  strokeDasharray="8 6"
                  markerEnd="url(#arrowhead)"
                  className="animate-[flow_1s_linear_infinite]"
                />
                <text
                  x={midX}
                  y={midY - 6}
                  textAnchor="middle"
                  fill="hsl(55 100% 60%)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {shift.quantity} units
                </text>
              </g>
            );
          })}

          {/* Supplier points */}
          {suppliers.map((s) => {
            const pos = getPos(s);
            const hasError = errorSupplierIds.has(s.supplierId);
            return (
              <g key={s.supplierId}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={hasError ? 18 : 14}
                  fill={hasError ? "hsl(0 80% 50% / 0.3)" : "hsl(142 76% 36% / 0.3)"}
                  stroke={hasError ? "hsl(0 80% 55%)" : "hsl(142 76% 40%)"}
                  strokeWidth="2"
                  className={hasError ? "animate-pulse" : ""}
                />
                <text
                  x={pos.x}
                  y={pos.y - 22}
                  textAnchor="middle"
                  fill="hsl(0 0% 90%)"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {s.name}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fill="hsl(0 0% 70%)"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {hasError ? "ERROR" : "OK"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <style>{`
        @keyframes flow {
          to { stroke-dashoffset: -14; }
        }
      `}</style>
    </div>
  );
}
