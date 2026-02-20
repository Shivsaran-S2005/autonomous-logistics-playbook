import { useSimulationContext } from "@/contexts/SimulationContext";
import { InventoryPanel } from "@/components/ares/InventoryPanel";

const InventoryPage = () => {
  const { world } = useSimulationContext();

  return (
    <div className="max-w-2xl mx-auto">
      <InventoryPanel world={world} />
    </div>
  );
};

export default InventoryPage;
