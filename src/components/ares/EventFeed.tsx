import { useNavigate } from "react-router-dom";
import { SimEvent } from "@/simulation/types";
import { useSpeechAlert } from "@/hooks/useSpeechAlert";

interface EventFeedProps {
  events: SimEvent[];
}

const severityColors: Record<string, string> = {
  info: "text-neon-cyan",
  warning: "text-neon-yellow",
  critical: "text-neon-red text-glow-red",
  success: "text-neon-green",
};

const typeBadge: Record<string, { label: string; color: string }> = {
  order: { label: "ORD", color: "border-neon-cyan/40 text-neon-cyan" },
  disruption: { label: "DIS", color: "border-neon-red/60 text-neon-red" },
  ai_decision: { label: "A.I", color: "border-neon-magenta/60 text-neon-magenta" },
  delivery: { label: "DEL", color: "border-neon-green/40 text-neon-green" },
  alert: { label: "SYS", color: "border-neon-yellow/40 text-neon-yellow" },
  recovery: { label: "REC", color: "border-neon-green/60 text-neon-green" },
};

export function EventFeed({ events }: EventFeedProps) {
  const navigate = useNavigate();
  useSpeechAlert(events);

  return (
    <div className="cyber-panel p-4 h-full flex flex-col">
      <h2 className="font-display text-sm tracking-widest text-neon-cyan text-glow-cyan mb-3">
        // LIVE EVENT FEED
      </h2>
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-none">
        {events.map((evt, i) => {
          const badge = typeBadge[evt.type] || typeBadge.alert;
          const isError = evt.severity === "critical" || evt.severity === "warning";
          return (
            <div
              key={evt.id}
              className={`flex items-start gap-2 font-mono text-[11px] leading-tight py-1 ${i === 0 ? "animate-slide-in" : ""}`}
            >
              <span className="text-muted-foreground shrink-0 w-[52px]">
                {new Date(evt.timestamp).toLocaleTimeString("en", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className={`border px-1 rounded-sm text-[9px] shrink-0 ${badge.color}`}>
                {badge.label}
              </span>
              <span className={severityColors[evt.severity]}>
                {evt.message}
              </span>
              {isError && (
                <button
                  onClick={() => navigate(`/demo/issue?id=${evt.id}`)}
                  className="shrink-0 ml-auto border border-neon-red/50 text-neon-red px-1.5 py-0.5 rounded-sm text-[9px] hover:bg-neon-red/10 transition-colors"
                >
                  FIX
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
