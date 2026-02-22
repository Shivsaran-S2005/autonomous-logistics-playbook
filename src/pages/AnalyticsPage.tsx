import { useSimulationContext } from "@/contexts/SimulationContext";
import { MetricsPanel } from "@/components/ares/MetricsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

const chartConfig = {
  delivered: { label: "Delivered", color: "hsl(142 76% 36%)" },
  failed: { label: "Failed", color: "hsl(0 84% 60%)" },
  aiActions: { label: "AI Actions", color: "hsl(280 100% 60%)" },
  stockoutsAvoided: { label: "Stockouts Avoided", color: "hsl(45 93% 47%)" },
  uptime: { label: "Uptime %", color: "hsl(189 94% 43%)" },
  tick: { label: "Tick", color: "hsl(0 0% 60%)" },
};

export default function AnalyticsPage() {
  const { world } = useSimulationContext();
  const { metrics, metricsHistory = [] } = world;

  const barData = [
    { name: "Delivered", value: metrics.ordersCompleted, fill: chartConfig.delivered.color },
    { name: "Failed", value: metrics.ordersFailed, fill: chartConfig.failed.color },
    { name: "AI Actions", value: metrics.aiInterventions, fill: chartConfig.aiActions.color },
    { name: "Stockouts Avoided", value: metrics.stockoutsAvoided, fill: chartConfig.stockoutsAvoided.color },
    { name: "Uptime %", value: metrics.uptime, fill: chartConfig.uptime.color },
  ];

  const lineData = [...metricsHistory].reverse().map((s) => ({
    tick: s.tick,
    delivered: s.metrics.ordersCompleted,
    failed: s.metrics.ordersFailed,
    aiActions: s.metrics.aiInterventions,
    uptime: s.metrics.uptime,
  }));

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl tracking-widest text-neon-cyan text-glow-cyan">
        // ANALYTICS
      </h1>
      <MetricsPanel metrics={metrics} showExport />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="py-2">
            <CardTitle className="text-xs font-mono">Current KPIs — Bar chart</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill={(entry: { fill?: string }) => entry?.fill ?? "hsl(0 0% 60%)"} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="py-2">
            <CardTitle className="text-xs font-mono">Metrics over time (last 60 ticks)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {lineData.length < 2 ? (
              <p className="font-mono text-xs text-muted-foreground flex items-center justify-center h-full">Run simulation to see metrics over time.</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="tick" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="delivered" stroke={chartConfig.delivered.color} strokeWidth={2} dot={false} name="Delivered" />
                  <Line type="monotone" dataKey="aiActions" stroke={chartConfig.aiActions.color} strokeWidth={2} dot={false} name="AI Actions" />
                  <Line type="monotone" dataKey="uptime" stroke={chartConfig.uptime.color} strokeWidth={2} dot={false} name="Uptime %" />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
