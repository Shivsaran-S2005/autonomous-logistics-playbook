import { useSimulation } from "@/hooks/useSimulation";
import { MapGrid } from "@/components/ares/MapGrid";
import { InventoryPanel } from "@/components/ares/InventoryPanel";
import { EventFeed } from "@/components/ares/EventFeed";
import { AIDecisionsPanel } from "@/components/ares/AIDecisionsPanel";
import { MetricsPanel } from "@/components/ares/MetricsPanel";
import { DisruptionControls } from "@/components/ares/DisruptionControls";
import { TruckStatus } from "@/components/ares/TruckStatus";

const Index = () => {
  const { world, start, stop, reset, triggerDisruption, clearDisruption, triggerManualScenario } = useSimulation();

  return (
    <div className="min-h-screen bg-background cyber-grid-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl text-neon-cyan text-glow-cyan tracking-[0.3em]">
            // ARES
          </span>
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider hidden sm:inline">
            AUTONOMOUS RESILIENT EXECUTION SYSTEM
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-muted-foreground">
            v1.0.77
          </span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${world.running ? "bg-neon-green animate-pulse-glow" : "bg-muted-foreground"}`} />
            <span className="font-mono text-[10px] text-neon-cyan">
              {world.running ? "ONLINE" : "STANDBY"}
            </span>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="px-4 pt-3">
        <DisruptionControls
          world={world}
          onStart={start}
          onStop={stop}
          onReset={reset}
          onTriggerDisruption={triggerDisruption}
          onClearDisruption={clearDisruption}
          onTriggerManualScenario={triggerManualScenario}
        />
      </div>

      {/* Metrics */}
      <div className="px-4 pt-3">
        <MetricsPanel metrics={world.metrics} />
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 p-4 min-h-0">
        {/* Left: Map + Fleet */}
        <div className="flex flex-col gap-3">
          <div className="flex-1 min-h-[300px]">
            <MapGrid world={world} />
          </div>
          <TruckStatus world={world} />
        </div>

        {/* Center: Events + Inventory */}
        <div className="flex flex-col gap-3">
          <div className="flex-1 min-h-[200px]">
            <EventFeed events={world.events} />
          </div>
          <InventoryPanel world={world} />
        </div>

        {/* Right: AI Decisions */}
        <div className="min-h-[300px]">
          <AIDecisionsPanel decisions={world.aiDecisions} />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-2 flex justify-between font-mono text-[9px] text-muted-foreground">
        <span>[ ARES DIGITAL TWIN — SUPPLY CHAIN INTELLIGENCE ]</span>
        <span>TICK {world.tick} | {new Date().toLocaleTimeString("en", { hour12: false })}</span>
      </footer>
    </div>
  );
};

export default Index;
