import { useState, useMemo } from "react";
import { useSimulationContext } from "@/contexts/SimulationContext";
import { AIDecision } from "@/simulation/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

type FilterType = "all" | "high_confidence" | "with_risk_reduction";

function filterDecisions(decisions: AIDecision[], type: FilterType): AIDecision[] {
  if (type === "all") return decisions;
  if (type === "high_confidence") return decisions.filter((d) => d.confidence >= 0.85);
  if (type === "with_risk_reduction") return decisions.filter((d) => d.riskReduction != null && d.riskReduction > 0);
  return decisions;
}

function exportDecisionsCsv(decisions: AIDecision[]) {
  const header = "Id,Timestamp,Action,Reason,Impact,Confidence,RiskReduction,Demand,Supply,Risk,Latency";
  const rows = decisions.map((d) => {
    const b = d.confidenceBreakdown;
    return [
      d.id,
      new Date(d.timestamp).toISOString(),
      `"${(d.action ?? "").replace(/"/g, '""')}"`,
      `"${(d.reason ?? "").replace(/"/g, '""')}"`,
      `"${(d.impact ?? "").replace(/"/g, '""')}"`,
      (d.confidence * 100).toFixed(1),
      d.riskReduction != null ? (d.riskReduction * 100).toFixed(1) : "",
      b?.demand != null ? (b.demand * 100).toFixed(0) : "",
      b?.supply != null ? (b.supply * 100).toFixed(0) : "",
      b?.risk != null ? (b.risk * 100).toFixed(0) : "",
      b?.latency != null ? (b.latency * 100).toFixed(0) : "",
    ].join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ai-decisions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExplainabilityPage() {
  const { world } = useSimulationContext();
  const [filter, setFilter] = useState<FilterType>("all");

  const decisions = useMemo(() => filterDecisions(world.aiDecisions, filter), [world.aiDecisions, filter]);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-display text-xl tracking-widest text-neon-magenta text-glow-magenta">
          // EXPLAINABILITY — DECISION HISTORY
        </h1>
        <div className="flex gap-2 items-center">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-[200px] font-mono text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All decisions</SelectItem>
              <SelectItem value="high_confidence">High confidence (≥85%)</SelectItem>
              <SelectItem value="with_risk_reduction">With risk reduction</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => exportDecisionsCsv(decisions)} disabled={decisions.length === 0}>
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>
      <Card className="border-border">
        <CardHeader className="py-2">
          <CardTitle className="text-xs font-mono">Every AI decision with reasoning and confidence breakdown</CardTitle>
        </CardHeader>
        <CardContent className="py-2 max-h-[60vh] overflow-y-auto space-y-3">
          {decisions.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">No decisions match the filter. Run the simulation to see AI decisions.</p>
          ) : (
            decisions.map((dec) => (
              <div key={dec.id} className="border border-neon-magenta/20 rounded p-3 space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="font-display text-xs text-neon-magenta">{dec.action}</span>
                  <span className="font-mono text-[10px] text-neon-cyan">{(dec.confidence * 100).toFixed(0)}%</span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">{dec.reason}</p>
                <p className="font-mono text-[11px] text-neon-green">→ {dec.impact}</p>
                {dec.riskReduction != null && dec.riskReduction > 0 && (
                  <p className="font-mono text-[10px] text-neon-cyan">Risk reduced: {(dec.riskReduction * 100).toFixed(0)}%</p>
                )}
                {dec.confidenceBreakdown && (
                  <div className="flex flex-wrap gap-x-3 font-mono text-[9px] text-muted-foreground">
                    {dec.confidenceBreakdown.demand != null && <span>demand: {(dec.confidenceBreakdown.demand * 100).toFixed(0)}%</span>}
                    {dec.confidenceBreakdown.supply != null && <span>supply: {(dec.confidenceBreakdown.supply * 100).toFixed(0)}%</span>}
                    {dec.confidenceBreakdown.risk != null && <span>risk: {(dec.confidenceBreakdown.risk * 100).toFixed(0)}%</span>}
                    {dec.confidenceBreakdown.latency != null && <span>latency: {(dec.confidenceBreakdown.latency * 100).toFixed(0)}%</span>}
                  </div>
                )}
                <span className="font-mono text-[9px] text-muted-foreground">{new Date(dec.timestamp).toLocaleString("en", { hour12: false })}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
