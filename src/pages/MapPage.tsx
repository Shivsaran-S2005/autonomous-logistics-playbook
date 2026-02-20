import { useSimulationContext } from "@/contexts/SimulationContext";
import { MapGrid } from "@/components/ares/MapGrid";
import { TruckStatus } from "@/components/ares/TruckStatus";

const MapPage = () => {
  const { world } = useSimulationContext();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      <div className="lg:col-span-2 min-h-[400px]">
        <MapGrid world={world} />
      </div>
      <div>
        <TruckStatus world={world} />
      </div>
    </div>
  );
};

export default MapPage;
