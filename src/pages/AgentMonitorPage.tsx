import { useSimulationContext } from "@/contexts/SimulationContext";
import { TruckStatus } from "@/components/ares/TruckStatus";
import { MapGrid } from "@/components/ares/MapGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgentMonitorPage() {
  const { world } = useSimulationContext();

  const agents = [
    { id: "cocoa", name: "Cocoa Agent", status: world.activeScenario === "cocoa_shortage" ? "Disrupted" : "Healthy", description: "Cadbury cocoa supply" },
    { id: "peanut", name: "Peanut Agent", status: world.activeScenario === "peanut_contamination" ? "Disrupted" : "Healthy", description: "Peanut product recall / Mars link" },
    ...world.suppliers.map((s) => ({ id: s.id, name: s.name, status: s.active ? "Healthy" : "Disrupted", description: `Reliability ${(s.reliability * 100).toFixed(0)}%` })),
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl tracking-widest text-neon-magenta text-glow-magenta">
        // AGENT MONITOR
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <TruckStatus world={world} />
        </div>
        <Card className="border-border">
          <CardHeader className="py-2">
            <CardTitle className="text-xs font-mono">Agents (Suppliers + Scenario)</CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-2">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b border-border/50 pb-1.5 font-mono text-[11px]">
                <div>
                  <span className="text-foreground">{a.name}</span>
                  <span className="text-muted-foreground ml-2">— {a.description}</span>
                </div>
                <span
                  className={
                    a.status === "Healthy"
                      ? "text-neon-green"
                      : a.status === "Disrupted"
                        ? "text-neon-red"
                        : "text-muted-foreground"
                  }
                >
                  {a.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="min-h-[300px]">
        <MapGrid world={world} />
      </div>
    </div>
  );
}
