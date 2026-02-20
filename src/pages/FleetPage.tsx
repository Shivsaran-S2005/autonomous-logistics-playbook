import { useSimulationContext } from "@/contexts/SimulationContext";
import { TruckStatus } from "@/components/ares/TruckStatus";
import { MetricsPanel } from "@/components/ares/MetricsPanel";

const FleetPage = () => {
  const { world } = useSimulationContext();

  return (
    <div className="flex flex-col gap-4">
      <MetricsPanel metrics={world.metrics} />
      <TruckStatus world={world} />
    </div>
  );
};

export default FleetPage;
