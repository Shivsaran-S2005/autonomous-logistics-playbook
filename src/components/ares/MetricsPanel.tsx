import { Metrics } from "@/simulation/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface MetricsPanelProps {
  metrics: Metrics;
  /** When set, show Export KPIs CSV button */
  showExport?: boolean;
}

export function MetricsPanel({ metrics, showExport = false }: MetricsPanelProps) {
  const items = [
    { label: "DELIVERED", value: metrics.ordersCompleted, color: "text-neon-green text-glow-green" },
    { label: "FAILED", value: metrics.ordersFailed, color: "text-neon-red text-glow-red" },
    { label: "AI ACTIONS", value: metrics.aiInterventions, color: "text-neon-magenta text-glow-magenta" },
    { label: "STOCKOUTS AVOIDED", value: metrics.stockoutsAvoided, color: "text-neon-yellow text-glow-yellow" },
    { label: "UPTIME", value: `${metrics.uptime}%`, color: "text-neon-cyan text-glow-cyan" },
  ];

  const exportKpisCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["Orders Delivered", metrics.ordersCompleted],
      ["Orders Failed", metrics.ordersFailed],
      ["AI Interventions", metrics.aiInterventions],
      ["Stockouts Avoided", metrics.stockoutsAvoided],
      ["Uptime %", metrics.uptime],
      ["Avg Delivery Time", metrics.avgDeliveryTime],
      ["Exported At", new Date().toISOString()],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kpis-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cyber-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm tracking-widest text-neon-cyan text-glow-cyan">
          // METRICS
        </h2>
        {showExport && (
          <Button variant="ghost" size="sm" className="font-mono text-[10px] h-7" onClick={exportKpisCsv}>
            <Download className="w-3 h-3 mr-1" /> Export KPIs
          </Button>
        )}
      </div>
      <div className="grid grid-cols-5 gap-3">
        {items.map(item => (
          <div key={item.label} className="text-center space-y-1">
            <div className={`font-display text-2xl ${item.color}`}>
              {item.value}
            </div>
            <div className="font-mono text-[9px] text-muted-foreground tracking-wider">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
