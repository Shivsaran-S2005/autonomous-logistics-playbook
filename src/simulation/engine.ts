import { WorldState, SimEvent, AIDecision } from "./types";

let eventCounter = 0;
let decisionCounter = 0;

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createInitialWorld(): WorldState {
  return {
    suppliers: [
      { id: "sup_1", name: "NEXUS CORP", pos: { x: 1, y: 1 }, reliability: 0.95, baseReliability: 0.95, active: true },
      { id: "sup_2", name: "CYBERTEK", pos: { x: 8, y: 0 }, reliability: 0.88, baseReliability: 0.88, active: true },
    ],
    warehouses: [
      { id: "wh_1", name: "VAULT ALPHA", pos: { x: 3, y: 4 }, inventory: 80, maxInventory: 120, demandRate: 3 },
      { id: "wh_2", name: "VAULT BETA", pos: { x: 7, y: 5 }, inventory: 65, maxInventory: 100, demandRate: 2.5 },
    ],
    retailers: [
      { id: "ret_1", name: "SECTOR-7", pos: { x: 1, y: 8 }, demand: 8 },
      { id: "ret_2", name: "NIGHT CITY", pos: { x: 5, y: 9 }, demand: 12 },
      { id: "ret_3", name: "AFTERLIFE", pos: { x: 9, y: 7 }, demand: 6 },
    ],
    trucks: [
      { id: "TRK-01", pos: { x: 3, y: 4 }, target: null, busy: false, cargo: 0, route: "", speed: 0.3 },
      { id: "TRK-02", pos: { x: 7, y: 5 }, target: null, busy: false, cargo: 0, route: "", speed: 0.25 },
      { id: "TRK-03", pos: { x: 5, y: 3 }, target: null, busy: false, cargo: 0, route: "", speed: 0.35 },
    ],
    orders: [],
    events: [
      { id: "evt_init", timestamp: Date.now(), type: "alert", message: "[ ARES SYSTEM INITIALIZED ]", severity: "info" },
    ],
    aiDecisions: [],
    metrics: {
      ordersCompleted: 0,
      ordersFailed: 0,
      avgDeliveryTime: 0,
      stockoutsAvoided: 0,
      aiInterventions: 0,
      uptime: 100,
    },
    tick: 0,
    running: false,
    disruptions: { supplierFailure: false, roadBlock: false },
    mode: "AUTO_MODE",
    locked: false,
    pendingIssue: null,
  };
}

function addEvent(world: WorldState, type: SimEvent["type"], message: string, severity: SimEvent["severity"]) {
  eventCounter++;
  world.events.unshift({
    id: `evt_${eventCounter}`,
    timestamp: Date.now(),
    type,
    message,
    severity,
  });
  if (world.events.length > 50) world.events.pop();
}

function addDecision(world: WorldState, action: string, reason: string, impact: string, confidence: number) {
  decisionCounter++;
  world.aiDecisions.unshift({
    id: `dec_${decisionCounter}`,
    timestamp: Date.now(),
    action,
    reason,
    impact,
    confidence,
  });
  if (world.aiDecisions.length > 20) world.aiDecisions.pop();
  world.metrics.aiInterventions++;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function moveTruckToward(truck: typeof createInitialWorld extends () => infer W ? W extends { trucks: (infer T)[] } ? T : never : never, target: { x: number; y: number }, speedMod: number) {
  const dx = target.x - truck.pos.x;
  const dy = target.y - truck.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 0.4) {
    truck.pos = { ...target };
    return true;
  }
  const speed = truck.speed * speedMod;
  truck.pos = {
    x: truck.pos.x + (dx / dist) * speed,
    y: truck.pos.y + (dy / dist) * speed,
  };
  return false;
}

export function simulateTick(prev: WorldState): WorldState {
  const world: WorldState = JSON.parse(JSON.stringify(prev));
  
  // If in MANUAL_MODE, freeze all processing
  if (world.mode === "MANUAL_MODE") {
    world.tick++;
    return world;
  }
  
  world.tick++;

  const speedMod = world.disruptions.roadBlock ? 0.3 : 1;

  // Drain inventory from warehouses (simulated demand)
  world.warehouses.forEach(wh => {
    wh.inventory = Math.max(0, wh.inventory - wh.demandRate * 0.15);
  });

  // Generate random orders
  if (world.tick % 8 === 0) {
    const retailer = world.retailers[Math.floor(Math.random() * world.retailers.length)];
    const qty = 5 + Math.floor(Math.random() * 15);
    const order = {
      id: uid("ord"),
      retailer: retailer.name,
      warehouse: "",
      quantity: qty,
      status: "pending" as const,
      timestamp: Date.now(),
    };
    world.orders.push(order);
    addEvent(world, "order", `New order: ${qty} units → ${retailer.name}`, "info");
  }

  // AI: Predict shortages
  world.warehouses.forEach(wh => {
    if (wh.inventory < wh.maxInventory * 0.25 && wh.inventory > 0) {
      // Predict and prevent
      const bestSupplier = world.suppliers
        .filter(s => s.active)
        .sort((a, b) => b.reliability - a.reliability)[0];
      
      if (bestSupplier && Math.random() < 0.3) {
        const resupply = 15 + Math.floor(Math.random() * 20);
        wh.inventory = Math.min(wh.maxInventory, wh.inventory + resupply);
        world.metrics.stockoutsAvoided++;
        addDecision(
          world,
          `Emergency resupply → ${wh.name}`,
          `Inventory at ${Math.round(wh.inventory)}/${wh.maxInventory}. Predicted stockout in ~${Math.floor(Math.random() * 3) + 1} cycles.`,
          `+${resupply} units from ${bestSupplier.name}`,
          0.85 + Math.random() * 0.12,
        );
        addEvent(world, "ai_decision", `AI: Resupplied ${wh.name} (+${resupply}) via ${bestSupplier.name}`, "success");
      }
    }

    if (wh.inventory <= 0) {
      const stockoutEvent: SimEvent = {
        id: `evt_stockout_${Date.now()}`,
        timestamp: Date.now(),
        type: "alert",
        message: `⚠ STOCKOUT: ${wh.name} empty!`,
        severity: "critical",
      };
      addEvent(world, "alert", stockoutEvent.message, "critical");
      world.metrics.ordersFailed++;

      // AI attempts auto-fix first (no randomness)
      if (world.mode === "AUTO_MODE" && !world.locked) {
        const availableSupplier = world.suppliers.find(s => s.active && s.reliability > 0.5);
        if (availableSupplier) {
          // AI succeeds: emergency resupply
          const resupply = 25;
          wh.inventory = Math.min(wh.maxInventory, wh.inventory + resupply);
          addEvent(world, "ai_decision", `AI: Auto-fixed ${wh.name} stockout (+${resupply} units)`, "success");
          addDecision(
            world,
            `Auto-fix: Emergency resupply → ${wh.name}`,
            `Stockout detected. Emergency resupply from ${availableSupplier.name}.`,
            `+${resupply} units restored`,
            0.9,
          );
          // Mark the stockout event as Resolved by AI (it is at index 1 after unshift of success)
          const criticalEvt = world.events[1];
          if (criticalEvt && criticalEvt.severity === "critical") {
            criticalEvt.resolvedBy = "ai";
            criticalEvt.severity = "success";
          }
        } else {
          // AI fails - switch to MANUAL_MODE, lock, alert
          world.mode = "MANUAL_MODE";
          world.locked = true;
          world.pendingIssue = world.events[0]; // event just added
          addEvent(world, "alert", "Manual Mode Activated – Please resolve the issue.", "critical");
          addDecision(
            world,
            `Auto-fix FAILED → Manual Mode`,
            `No available suppliers for emergency resupply.`,
            `System locked. Awaiting manual resolution.`,
            0.0,
          );
        }
      }
    }
  });

  // Handle supplier failures from disruptions
  if (world.disruptions.supplierFailure) {
    world.suppliers[0].reliability = 0.1;
    world.suppliers[0].active = false;

    // AI tries to fix first (no randomness)
    if (world.mode === "AUTO_MODE" && !world.locked && world.tick % 10 === 0) {
      const altSupplier = world.suppliers.find(s => s.id !== "sup_1" && s.reliability > 0.5);
      if (altSupplier) {
        addDecision(
          world,
          `Reroute supply → ${altSupplier.name}`,
          `${world.suppliers[0].name} failure detected. Reliability: ${(world.suppliers[0].reliability * 100).toFixed(0)}%`,
          `Switched to ${altSupplier.name} (${(altSupplier.reliability * 100).toFixed(0)}% reliable)`,
          0.92,
        );
        addEvent(world, "ai_decision", `AI: Rerouted supply to ${altSupplier.name}`, "success");
        // Mark most recent critical event as Resolved by AI
        const criticalEvt = world.events.find(e => e.severity === "critical" && (e.type === "disruption" || e.type === "alert"));
        if (criticalEvt) {
          criticalEvt.resolvedBy = "ai";
          criticalEvt.severity = "success";
        }
      } else {
        // AI fails - switch to MANUAL_MODE, lock, alert
        const failureEvent: SimEvent = {
          id: `evt_supplier_fail_${Date.now()}`,
          timestamp: Date.now(),
          type: "disruption",
          message: `🔥 CRITICAL: ${world.suppliers[0].name} supplier has FAILED - No alternative available`,
          severity: "critical",
        };
        world.mode = "MANUAL_MODE";
        world.locked = true;
        addEvent(world, "disruption", failureEvent.message, "critical");
        world.pendingIssue = world.events[0]; // event just added
        addEvent(world, "alert", "Manual Mode Activated – Please resolve the issue.", "critical");
        addDecision(
          world,
          `Auto-reroute FAILED → Manual Mode`,
          `No alternative suppliers available for rerouting.`,
          `System locked. Awaiting manual resolution.`,
          0.0,
        );
      }
    }
  } else {
    world.suppliers.forEach(s => {
      s.reliability = s.baseReliability;
      s.active = true;
    });
  }

  // Process pending orders — assign trucks
  world.orders.forEach(order => {
    if (order.status === "pending") {
      const wh = world.warehouses.find(w => w.inventory >= order.quantity) 
        || world.warehouses.sort((a, b) => b.inventory - a.inventory)[0];
      
      const freeTruck = world.trucks.find(t => !t.busy);
      if (freeTruck && wh && wh.inventory >= order.quantity) {
        freeTruck.busy = true;
        freeTruck.cargo = order.quantity;
        const retailer = world.retailers.find(r => r.name === order.retailer);
        if (retailer) {
          freeTruck.target = { ...retailer.pos };
          freeTruck.route = `${wh.name} → ${order.retailer}`;
        }
        wh.inventory -= order.quantity;
        order.warehouse = wh.name;
        order.status = "in_transit";
        addEvent(world, "delivery", `${freeTruck.id}: ${freeTruck.route} (${order.quantity} units)`, "info");
      }
    }
  });

  // Move trucks
  world.trucks.forEach(truck => {
    if (truck.busy && truck.target) {
      const arrived = moveTruckToward(truck, truck.target, speedMod);
      if (arrived) {
        truck.busy = false;
        truck.target = null;
        truck.cargo = 0;
        world.metrics.ordersCompleted++;
        addEvent(world, "delivery", `✓ ${truck.id} delivered. Route: ${truck.route}`, "success");
        truck.route = "";
        
        // Return truck to nearest warehouse
        const nearestWh = world.warehouses.sort((a, b) => 
          distance(truck.pos, a.pos) - distance(truck.pos, b.pos)
        )[0];
        truck.target = { ...nearestWh.pos };
      }
    } else if (truck.target) {
      const arrived = moveTruckToward(truck, truck.target, speedMod);
      if (arrived) truck.target = null;
    }
  });

  // Clean up old delivered orders
  world.orders = world.orders.filter(o => o.status !== "delivered").slice(-20);
  world.orders.forEach(o => {
    if (o.status === "in_transit" && !world.trucks.some(t => t.busy && t.route.includes(o.retailer))) {
      o.status = "delivered";
    }
  });

  // Road block effects
  if (world.disruptions.roadBlock && world.tick % 12 === 0) {
    addDecision(
      world,
      "Rerouting transport fleet",
      "Road blockage detected. Estimated delay: +200%",
      "Alternative routes calculated. ETA adjusted.",
      0.78,
    );
  }

  // Update uptime metric
  const totalOrders = world.metrics.ordersCompleted + world.metrics.ordersFailed;
  world.metrics.uptime = totalOrders > 0 
    ? Math.round((world.metrics.ordersCompleted / totalOrders) * 100) 
    : 100;

  return world;
}
