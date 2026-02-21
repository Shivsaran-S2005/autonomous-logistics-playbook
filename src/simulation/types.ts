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

export interface AIDecision {
  id: string;
  timestamp: number;
  action: string;
  reason: string;
  impact: string;
  confidence: number;
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
  tick: number;
  running: boolean;
  disruptions: { supplierFailure: boolean; roadBlock: boolean };
  mode: SystemMode;
  locked: boolean;
  pendingIssue: SimEvent | null;
}
