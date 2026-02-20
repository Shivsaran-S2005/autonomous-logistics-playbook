import { useSimulationContext } from "@/contexts/SimulationContext";
import { AIDecisionsPanel } from "@/components/ares/AIDecisionsPanel";
import { MetricsPanel } from "@/components/ares/MetricsPanel";

const AIBrainPage = () => {
  const { world } = useSimulationContext();

  return (
    <div className="flex flex-col gap-4">
      <MetricsPanel metrics={world.metrics} />
      <div className="max-w-3xl mx-auto w-full min-h-[500px]">
        <AIDecisionsPanel decisions={world.aiDecisions} />
      </div>
    </div>
  );
};

export default AIBrainPage;
