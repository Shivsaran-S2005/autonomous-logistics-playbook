// Simulation types for ARES supply chain digital twin

export interface Position {
  x: number;
  y: number;
}

export interface Supplier {
  id: string;
  name: string;
  pos: Position;
  reliability: number;
  baseReliability: number;
  active: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  pos: Position;
  inventory: number;
  maxInventory: number;
  demandRate: number;
}

export interface Retailer {
  id: string;
  name: string;
  pos: Position;
  demand: number;
}

export interface Truck {
  id: string;
  pos: Position;
  target: Position | null;
  busy: boolean;
  cargo: number;
  route: string;
  speed: number;
  /** When set, truck is doing an internal transfer; on arrival target warehouse gets cargo */
  transferId?: string;
}

/** Internal transfer: move stock from one warehouse to another (live on map) */
export interface InternalTransfer {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  status: "pending" | "assigned" | "in_transit" | "completed";
  requestId?: string; // link to retailer request if triggered by resolve
}

export interface Order {
  id: string;
  retailer: string;
  warehouse: string;
  quantity: number;
  status: "pending" | "assigned" | "in_transit" | "delivered" | "failed";
  timestamp: number;
}

export interface SimEvent {
  id: string;
  timestamp: number;
  type: "order" | "disruption" | "ai_decision" | "delivery" | "alert" | "recovery";
  message: string;
  severity: "info" | "warning" | "critical" | "success";
  /** Set when an error was resolved by AI or manually; card shows green and status. */
  resolvedBy?: "ai" | "manual";
}

/** Confidence breakdown by factor (e.g. demand, supply, risk) — for explainability */
export interface ConfidenceBreakdown {
  demand?: number;
  supply?: number;
  risk?: number;
  latency?: number;
}

export interface AIDecision {
  id: string;
  timestamp: number;
  action: string;
  reason: string;
  impact: string;
  confidence: number;
  /** Per-factor confidence for explainability */
  confidenceBreakdown?: ConfidenceBreakdown;
  /** Risk reduction percentage (e.g. 0.15 = 15% risk reduced) */
  riskReduction?: number;
}

export interface Metrics {
  ordersCompleted: number;
  ordersFailed: number;
  avgDeliveryTime: number;
  stockoutsAvoided: number;
  aiInterventions: number;
  uptime: number;
}

export type SystemMode = "AUTO_MODE" | "MANUAL_MODE";

/** Named scenario preset (Cocoa Shortage, Peanut Contamination) */
export type NamedScenario = "cocoa_shortage" | "peanut_contamination" | null;

/** Snapshot for charts (tick + metrics) */
export interface MetricsSnapshot {
  tick: number;
  timestamp: number;
  metrics: Metrics;
}

export interface WorldState {
  suppliers: Supplier[];
  warehouses: Warehouse[];
  retailers: Retailer[];
  trucks: Truck[];
  orders: Order[];
  /** Internal transfers (e.g. restock from WH1 to WH2) — show live on map */
  transfers: InternalTransfer[];
  events: SimEvent[];
  aiDecisions: AIDecision[];
  metrics: Metrics;
  /** Rolling history for Analytics charts (last N ticks) */
  metricsHistory?: MetricsSnapshot[];
  tick: number;
  running: boolean;
  disruptions: { supplierFailure: boolean; roadBlock: boolean };
  mode: SystemMode;
  locked: boolean;
  pendingIssue: SimEvent | null;
  /** Active named scenario for UI (node states, edge delay styling) */
  activeScenario?: NamedScenario;
}
