import { useSimulationContext } from "@/contexts/SimulationContext";
import { MetricsPanel } from "@/components/ares/MetricsPanel";
import { MapGrid } from "@/components/ares/MapGrid";
import { EventFeed } from "@/components/ares/EventFeed";
import { AIDecisionsPanel } from "@/components/ares/AIDecisionsPanel";

const OverviewPage = () => {
  const { world } = useSimulationContext();

  return (
    <div className="flex flex-col gap-3 h-full">
      <MetricsPanel metrics={world.metrics} />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-0">
        <div className="min-h-[300px]">
          <MapGrid world={world} />
        </div>
        <div className="min-h-[200px]">
          <EventFeed events={world.events} />
        </div>
        <div className="min-h-[300px]">
          <AIDecisionsPanel decisions={world.aiDecisions} />
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
