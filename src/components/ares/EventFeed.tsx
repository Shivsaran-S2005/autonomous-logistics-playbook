import { useNavigate, useLocation } from "react-router-dom";
import { SimEvent } from "@/simulation/types";
import { useSpeechAlert } from "@/hooks/useSpeechAlert";
import { useSimulationContext } from "@/contexts/SimulationContext";
import { useManualModeAlert } from "@/hooks/useManualModeAlert";

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
  const location = useLocation();
  const { world, setMode, resolveIssue } = useSimulationContext();
  const issueBase = location.pathname.startsWith("/consumer") ? "/consumer" : location.pathname.startsWith("/demo") ? "/demo" : "/demo";
  
  // Use regular speech alerts (will be suppressed in manual mode by the hook logic)
  useSpeechAlert(events);
  
  // Use manual mode alert when locked in MANUAL_MODE
  useManualModeAlert(world.locked, world.mode === "MANUAL_MODE");

  const handleResolveIssue = () => {
    resolveIssue();
  };

  return (
    <div className="cyber-panel p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm tracking-widest text-neon-cyan text-glow-cyan">
          // LIVE EVENT FEED
        </h2>
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode("AUTO_MODE")}
            className={`font-mono text-[9px] px-2 py-1 border rounded-sm transition-colors ${
              world.mode === "AUTO_MODE"
                ? "border-neon-cyan text-neon-cyan bg-neon-cyan/10"
                : "border-border text-muted-foreground hover:border-neon-cyan/50"
            }`}
          >
            AUTO
          </button>
          <button
            onClick={() => setMode("MANUAL_MODE")}
            className={`font-mono text-[9px] px-2 py-1 border rounded-sm transition-colors ${
              world.mode === "MANUAL_MODE"
                ? "border-neon-yellow text-neon-yellow bg-neon-yellow/10"
                : "border-border text-muted-foreground hover:border-neon-yellow/50"
            }`}
          >
            MANUAL
          </button>
        </div>
      </div>

      {/* Manual Mode Locked UI – only "Resolve Issue" allowed */}
      {world.mode === "MANUAL_MODE" && world.locked && world.pendingIssue && (
        <div className="mb-3 p-3 border border-neon-red/60 bg-neon-red/5 rounded-sm">
          <div className="font-mono text-[10px] text-neon-red text-glow-red mb-2">
            Manual intervention required.
          </div>
          <button
            onClick={handleResolveIssue}
            className="w-full font-mono text-[10px] border border-neon-green/60 text-neon-green px-3 py-1.5 rounded-sm hover:bg-neon-green/10 transition-colors font-semibold"
          >
            Resolve Issue
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-none">
        {events.map((evt, i) => {
          const badge = typeBadge[evt.type] || typeBadge.alert;
          const isResolved = evt.resolvedBy != null;
          const isError = (evt.severity === "critical" || evt.severity === "warning") && !isResolved;
          const colorClass = isResolved ? severityColors.success : severityColors[evt.severity];
          const statusText = evt.resolvedBy === "ai" ? "Resolved by AI" : evt.resolvedBy === "manual" ? "Resolved Manually" : null;
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
              <span className={colorClass}>
                {statusText != null ? statusText : evt.message}
              </span>
              {isError && world.mode !== "MANUAL_MODE" && !world.locked && (
                <button
                  onClick={() => navigate(`${issueBase}/issue?id=${evt.id}`)}
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
