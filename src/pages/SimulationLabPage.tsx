import { useSimulationContext } from "@/contexts/SimulationContext";
import { DisruptionControls } from "@/components/ares/DisruptionControls";
import { EventFeed } from "@/components/ares/EventFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SimulationLabPage() {
  const { world, start, stop, reset, triggerDisruption, clearDisruption, triggerManualScenario } = useSimulationContext();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl tracking-widest text-neon-yellow text-glow-yellow">
        // SIMULATION LAB
      </h1>
      <p className="font-mono text-[10px] text-muted-foreground">
        Run scenarios: Stockout, Supplier Fail, Dual Fail, Network Error, Cocoa Shortage, Peanut Contamination. Use RESET to return to clean state.
      </p>
      <DisruptionControls
        world={world}
        onStart={start}
        onStop={stop}
        onReset={reset}
        onTriggerDisruption={triggerDisruption}
        onClearDisruption={clearDisruption}
        onTriggerManualScenario={triggerManualScenario}
      />
      <Card className="border-border">
        <CardHeader className="py-2">
          <CardTitle className="text-xs font-mono">Live event feed</CardTitle>
        </CardHeader>
        <CardContent className="py-2 max-h-[40vh]">
          <EventFeed events={world.events} />
        </CardContent>
      </Card>
    </div>
  );
}
