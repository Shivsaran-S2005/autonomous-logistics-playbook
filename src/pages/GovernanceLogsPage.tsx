import { useState, useEffect } from "react";
import { getGovernanceLog, subscribeToGovernanceLog, clearGovernanceLog, type GovernanceEntry } from "@/lib/governanceLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";

function exportGovernanceCsv(entries: GovernanceEntry[]) {
  const header = "Timestamp,Type,UserId,Details,RefId";
  const rows = entries.map((e) =>
    [e.timestamp, e.type, e.userId ?? "", `"${(e.details ?? "").replace(/"/g, '""')}"`, e.refId ?? ""].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `governance-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const typeLabels: Record<string, string> = {
  mode_change: "Mode change",
  manual_resolve: "Manual resolve",
  scenario_trigger: "Scenario trigger",
  disruption_trigger: "Disruption trigger",
  disruption_clear: "Disruption clear",
  ai_decision_log: "AI decision",
  reset: "Reset",
};

export default function GovernanceLogsPage() {
  const [entries, setEntries] = useState<GovernanceEntry[]>(() => getGovernanceLog());

  useEffect(() => {
    setEntries(getGovernanceLog());
    const unsub = subscribeToGovernanceLog(() => setEntries(getGovernanceLog()));
    return unsub;
  }, []);

  const handleClear = () => {
    if (typeof window !== "undefined" && window.confirm("Clear all governance logs? This cannot be undone.")) {
      clearGovernanceLog();
      setEntries([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl tracking-widest text-neon-cyan text-glow-cyan">
          // GOVERNANCE LOGS
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs"
            onClick={() => exportGovernanceCsv(entries)}
            disabled={entries.length === 0}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" className="font-mono text-xs text-destructive" onClick={handleClear} disabled={entries.length === 0}>
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>
      <Card className="border-border">
        <CardHeader className="py-2">
          <CardTitle className="text-xs font-mono">Audit log — mode changes, overrides, scenario triggers</CardTitle>
        </CardHeader>
        <CardContent className="py-2 max-h-[60vh] overflow-y-auto">
          {entries.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">No governance entries yet. Trigger scenarios or change mode to populate.</p>
          ) : (
            <ul className="space-y-1.5 font-mono text-[11px]">
              {entries.map((e) => (
                <li key={e.id} className="border-b border-border/50 pb-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
                  <span className="text-muted-foreground shrink-0">{e.timestamp.replace("T", " ").slice(0, 19)}</span>
                  <span className="px-1 rounded bg-primary/20 text-primary shrink-0">{typeLabels[e.type] ?? e.type}</span>
                  {e.userId && <span className="text-muted-foreground">{e.userId}</span>}
                  <span className="text-foreground">{e.details}</span>
                  {e.refId && <span className="text-muted-foreground">ref: {e.refId}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
