import { useSearchParams, useNavigate } from "react-router-dom";
import { useSimulationContext } from "@/contexts/SimulationContext";
import { ArrowLeft } from "lucide-react";

const IssueDetailsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { world } = useSimulationContext();
  const eventId = searchParams.get("id");

  const event = world.events.find((e) => e.id === eventId);

  return (
    <div className="max-w-2xl mx-auto h-full p-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 font-mono text-[11px] text-primary hover:text-primary/80 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        BACK
      </button>

      <div className="cyber-panel p-6">
        <h2 className="font-display text-sm tracking-widest text-neon-red text-glow-red mb-4">
          // ISSUE DETAILS
        </h2>

        {event ? (
          <div className="space-y-4 font-mono text-xs">
            <div>
              <span className="text-muted-foreground">ID:</span>{" "}
              <span className="text-foreground">{event.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">TIMESTAMP:</span>{" "}
              <span className="text-foreground">
                {new Date(event.timestamp).toLocaleString("en", { hour12: false })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">TYPE:</span>{" "}
              <span className="text-foreground uppercase">{event.type}</span>
            </div>
            <div>
              <span className="text-muted-foreground">SEVERITY:</span>{" "}
              <span className={event.severity === "critical" ? "text-neon-red" : "text-neon-yellow"}>
                {event.severity.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">MESSAGE:</span>{" "}
              <span className="text-foreground">{event.message}</span>
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <span className="text-muted-foreground">STATUS:</span>{" "}
              <span className="text-neon-yellow">UNDER INVESTIGATION</span>
            </div>
          </div>
        ) : (
          <p className="font-mono text-xs text-muted-foreground">Event not found.</p>
        )}
      </div>
    </div>
  );
};

export default IssueDetailsPage;
