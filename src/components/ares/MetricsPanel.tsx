import { Metrics } from "@/simulation/types";

interface MetricsPanelProps {
  metrics: Metrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const items = [
    { label: "DELIVERED", value: metrics.ordersCompleted, color: "text-neon-green text-glow-green" },
    { label: "FAILED", value: metrics.ordersFailed, color: "text-neon-red text-glow-red" },
    { label: "AI ACTIONS", value: metrics.aiInterventions, color: "text-neon-magenta text-glow-magenta" },
    { label: "STOCKOUTS AVOIDED", value: metrics.stockoutsAvoided, color: "text-neon-yellow text-glow-yellow" },
    { label: "UPTIME", value: `${metrics.uptime}%`, color: "text-neon-cyan text-glow-cyan" },
  ];

  return (
    <div className="cyber-panel p-4">
      <h2 className="font-display text-sm tracking-widest text-neon-cyan text-glow-cyan mb-3">
        // METRICS
      </h2>
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
