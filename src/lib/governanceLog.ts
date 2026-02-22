/**
 * Governance / audit log: mode changes, manual overrides, scenario triggers, resolutions.
 * Persisted to localStorage for export and compliance.
 */

export type GovernanceEntryType =
  | "mode_change"
  | "manual_resolve"
  | "scenario_trigger"
  | "disruption_trigger"
  | "disruption_clear"
  | "ai_decision_log"
  | "reset";

export interface GovernanceEntry {
  id: string;
  timestamp: string; // ISO
  type: GovernanceEntryType;
  userId?: string;
  details: string;
  /** Optional link to event/decision id */
  refId?: string;
}

const STORAGE_KEY = "ares_governance_log";
const MAX_ENTRIES = 500;

let listeners: Array<() => void> = [];

function loadLog(): GovernanceEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GovernanceEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLog(entries: GovernanceEntry[]) {
  const toSave = entries.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore quota
  }
  listeners.forEach((cb) => cb());
}

function uid(): string {
  return `gov_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getGovernanceLog(): GovernanceEntry[] {
  return loadLog();
}

export function addGovernanceEntry(
  type: GovernanceEntryType,
  details: string,
  opts?: { userId?: string; refId?: string }
): void {
  const entries = loadLog();
  entries.unshift({
    id: uid(),
    timestamp: new Date().toISOString(),
    type,
    userId: opts?.userId,
    details,
    refId: opts?.refId,
  });
  saveLog(entries);
}

export function subscribeToGovernanceLog(callback: () => void): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}

/** Clear governance log (e.g. for reset script). */
export function clearGovernanceLog(): void {
  saveLog([]);
}
