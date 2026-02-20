import { useSimulationContext } from "@/contexts/SimulationContext";
import { EventFeed } from "@/components/ares/EventFeed";

const EventsPage = () => {
  const { world } = useSimulationContext();

  return (
    <div className="max-w-3xl mx-auto h-full min-h-[500px]">
      <EventFeed events={world.events} />
    </div>
  );
};

export default EventsPage;
