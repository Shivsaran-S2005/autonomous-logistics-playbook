import { AIDecision } from "@/simulation/types";

interface AIDecisionsPanelProps {
  decisions: AIDecision[];
}

export function AIDecisionsPanel({ decisions }: AIDecisionsPanelProps) {
  return (
    <div className="cyber-panel p-4 h-full flex flex-col">
      <h2 className="font-display text-sm tracking-widest text-neon-magenta text-glow-magenta mb-3">
        // AI DECISIONS
      </h2>
      <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none">
        {decisions.length === 0 && (
          <p className="font-mono text-xs text-muted-foreground animate-pulse-glow">
            Awaiting simulation data...
          </p>
        )}
        {decisions.map((dec, i) => (
          <div
            key={dec.id}
            className={`border border-neon-magenta/20 rounded p-3 space-y-1.5 ${i === 0 ? "animate-slide-in border-neon-magenta/40" : ""}`}
          >
            <div className="flex justify-between items-start">
              <span className="font-display text-xs text-neon-magenta">
                {dec.action}
              </span>
              <span className="font-mono text-[10px] text-neon-cyan">
                {(dec.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground leading-tight">
              {dec.reason}
            </p>
            <p className="font-mono text-[11px] text-neon-green leading-tight">
              → {dec.impact}
            </p>
            {dec.riskReduction != null && dec.riskReduction > 0 && (
              <p className="font-mono text-[10px] text-neon-cyan">
                Risk reduced: {(dec.riskReduction * 100).toFixed(0)}%
              </p>
            )}
            {dec.confidenceBreakdown && (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[9px] text-muted-foreground">
                {dec.confidenceBreakdown.demand != null && <span>demand: {(dec.confidenceBreakdown.demand * 100).toFixed(0)}%</span>}
                {dec.confidenceBreakdown.supply != null && <span>supply: {(dec.confidenceBreakdown.supply * 100).toFixed(0)}%</span>}
                {dec.confidenceBreakdown.risk != null && <span>risk: {(dec.confidenceBreakdown.risk * 100).toFixed(0)}%</span>}
                {dec.confidenceBreakdown.latency != null && <span>latency: {(dec.confidenceBreakdown.latency * 100).toFixed(0)}%</span>}
              </div>
            )}
            <span className="font-mono text-[9px] text-muted-foreground">
              {new Date(dec.timestamp).toLocaleTimeString("en", { hour12: false })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
