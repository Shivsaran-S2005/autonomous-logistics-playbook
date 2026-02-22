# Missing Features Checklist — Vital-Agent-Stream / AgenticAI Supply Chain Control

This document compares the **described project scope** (Executive Dashboard, Network View, Simulation Lab, Agent Monitor, Explainability, Analytics, Governance Logs, simulation scenarios, AI enhancements, voice/export/network/UI/realtime features, config/seed, and known issues) with the **current implementation**. Items listed here are **not yet integrated or only partially implemented**.

---

## 1. Simulation Scenarios

| Feature | Expected | Current State | Priority |
|--------|----------|---------------|----------|
| **Cocoa Shortage scenario** | Named scenario (e.g. cocoa supply disruption) with dedicated triggers and messaging. | Not present. Simulation uses generic suppliers (Cadbury, Nestle, Ferrero, Mars) and generic "stockout" / "supplier failure" scenarios. | **Critical** |
| **Peanut Contamination scenario** | Named scenario (e.g. peanut contamination event) with dedicated flow and resolution. | Not present. No product/supplier-specific contamination or recall scenarios. | **Critical** |
| **Named scenario presets** | One-click scenarios like "Cocoa Shortage", "Peanut Contamination" in UI. | Manual scenarios are generic: `stockout`, `supplier_failure`, `dual_supplier`, `network_error`. No Cocoa/Peanut presets. | High |
| **Reset / failure actions for scenarios** | Documented or scripted reset/failure actions (e.g. reset to clean state after scenario). | `reset()` clears world to `createInitialWorld()`; no scenario-specific reset scripts or failure-recovery actions documented. | Medium |

---

## 2. AI / Decision Engine Enhancements

| Feature | Expected | Current State | Priority |
|--------|----------|---------------|----------|
| **Confidence breakdown** | AI decisions show a breakdown of confidence by factor (e.g. demand, supply, risk). | Only a single `confidence` value (0–1) is shown as a percentage in `AIDecisionsPanel`. No per-factor breakdown. | High |
| **Risk reduction logs** | Logs or panel showing how each decision reduced risk (e.g. "Risk reduced by X%"). | Not implemented. `AIDecision` has `action`, `reason`, `impact`, `confidence` only; no risk metric or risk-reduction log. | High |
| **Decision history / export** | Export or dedicated view of full AI decision history (e.g. CSV or time-range filter). | Decisions live only in simulation state (`world.aiDecisions`), capped at 20. No export, no persistence, no dedicated history view. | Medium |

---

## 3. Voice and Text Alerts

| Feature | Expected | Current State | Priority |
|--------|----------|---------------|----------|
| **Supplier new-request voice** | Voice alert when a new retailer request arrives at supplier. | **Implemented** in `SupplierRequestsPage` via `speakNewRequestWithDetails`. | Done |
| **Resolved-issue voice (supplier)** | Voice when a request is marked Resolved (e.g. "Issue resolved…"). | **Implemented** via `speakResolvedForProductAndMessage` and auto-announce on Resolved. | Done |
| **Live feed error voice** | Voice for new errors on live map/feed. | **Implemented** in `LiveMapFeedPage` with `speakNewError`; enable-on-gesture supported. | Done |
| **Retailer-side voice** | Voice on retailer dashboard for new resolutions (e.g. "Your issue was resolved"). | Not implemented. Retailer sees CheckCircle + "Issue Resolved" visually only; no TTS on resolve. | Medium |
| **Text alert for resolved (supplier)** | Resolved request shown as text in Live Event Feed. | **Implemented** (green block with "Issue Resolved ✅" and resolution note). | Done |

---

## 4. Analytics Exports

| Feature | Expected | Current State | Priority |
|--------|----------|---------------|----------|
| **Retailer CSV exports** | Deliveries, stock levels, supplier performance as CSV. | **Implemented** on Retailer Dashboard (Export tab). | Done |
| **Executive / KPI CSV export** | Export of live KPIs (e.g. from Executive Dashboard / MetricsPanel: delivered, failed, AI actions, stockouts avoided, uptime) as CSV. | Not implemented. `MetricsPanel` is display-only; no "Export KPIs" or "Export metrics" button. | **Critical** |
| **Governance Logs export** | Export of governance/audit logs (AI decisions, manual overrides, mode changes) as CSV. | Not implemented. No Governance Logs page and no export of events/decisions as audit CSV. | **Critical** |

---

## 5. Explainability / Decision History

| Feature | Expected | Current State | Priority |
|--------|----------|---------------|----------|
| **Dedicated Explainability page** | Page named "Explainability" (or "Decision History") with full decision log and reasoning. | No dedicated route. "AI Brain" (`/consumer/ai`, `/demo/ai`) shows `AIDecisionsPanel` + `MetricsPanel` only; no separate Explainability page. | High |
| **Every AI decision logged with reasoning** | Marketing copy: "Full explainability — every AI decision is logged with reasoning". | Decisions are in-memory only, capped at 20, no persistence; reasoning is in `reason`/`impact` but not in a dedicated "explainability" or audit view. | High |
| **Filter by time / type / severity** | Filter decision or event history by time range, type, or severity. | Event feed and AI panel have no filters. | Medium |

---

## 6. Network Graph Features

| Feature | Expected | Current State | Priority |
|--------|----------|---------------|----------|
| **Node colors: Healthy / Alert / Disrupted / Recovered** | Semantic node states (e.g. green / yellow / red / blue) for suppliers, warehouses, retailers. | MapGrid uses: suppliers active (cyan) / inactive (red); warehouses by inventory fill (yellow/red when low); retailers (magenta); trucks (green). No explicit "Alert" or "Recovered" state. | High |
| **Edge delay styles** | Edges (routes/connections) styled by delay (e.g. dashed/thick for delayed links). | Only truck-to-target lines (dashed yellow); no explicit "edge" entity for supplier–warehouse–retailer links with delay styling. | High |
| **Network View as named page** | A dedicated "Network View" page in nav. | Map is under "MAP" (Overview/Map tabs); no nav item literally named "Network View". | Medium |

---

## 7. UI/UX Enhancements

| Feature | Expected | Current State | Priority |
|--------|----------|---------------|----------|
| **Semantic colors** | Consistent semantic palette (e.g. success/warning/critical) across dashboard. | Partial: EventFeed and MetricsPanel use neon semantic colors; MapGrid and others use similar palette but not a single design token set. | Low |
| **Glow accents** | Glow effects for key elements (e.g. primary, critical). | Present (e.g. `text-glow-cyan`, `text-glow-red`, `animate-pulse-glow`). | Done |
| **Pulse for disruptions** | Pulsing or animation when a disruption is active. | Trucks have `animate-truck-pulse` when busy; no dedicated pulse for "disruption active" on map nodes or header. | Medium |
| **Custom charts** | Custom charts for KPIs (e.g. time series of orders, uptime, AI interventions). | No charts. Metrics are numeric only in `MetricsPanel`; no line/bar charts. | High |

---

## 8. Realtime Features

| Feature | Expected | Current State | Priority |
|--------|----------|---------------|----------|
| **Live KPI updates** | KPIs update in real time as simulation runs. | **Implemented** via simulation tick and `MetricsPanel` bound to `world.metrics`. | Done |
| **Live simulation event feed** | Events stream as simulation runs. | **Implemented** via `EventFeed` and `world.events`. | Done |
| **Live agent/route updates** | Agents (trucks, transfers) and routes update live. | **Implemented**: trucks move on map; transfers show in events and on map. | Done |
| **Realtime subscriptions (backend)** | Backend-driven realtime (e.g. Supabase Realtime) for agents, routes, KPIs, simulation events. | Not implemented. All realtime is in-memory simulation + localStorage + 2s poll for retailer requests. No Supabase. | **Critical** |
| **Realtime for retailer requests** | Supplier and retailer see new/resolved requests without refresh. | **Implemented** (subscribeToUpdates + storage event + 2s poll). | Done |

---

## 9. Retailer / Supplier Page Enhancements

| Feature | Expected | Current State | Priority |
|--------|----------|---------------|----------|
| **Request resolution (supplier)** | Supplier can resolve with note; retailer sees resolution. | **Implemented** (resolve actions, resolution note, realtime sync). | Done |
| **Tick/check mark for resolved (retailer)** | Retailer sees resolved requests with a clear tick/check. | **Implemented** (CheckCircle + "Issue Resolved" badge + green border). | Done |
| **Request resolution (retailer-initiated)** | Retailer can request resolution or confirm receipt. | Retailer can only raise new requests; no "confirm resolution" or "request resolution" action from retailer side. | Low |

---

## 10. Configuration / Seed Data / Scripts

| Feature | Expected | Current State | Priority |
|--------|----------|---------------|----------|
| **Cocoa / Peanut agents** | Seed or config for agents (e.g. "Cocoa Agent", "Peanut Agent") for scenario play. | Simulation uses generic supplier names (Cadbury, Nestle, Ferrero, Mars). No product/commodity-specific agents. | **Critical** |
| **Reset scripts** | Script or button to reset simulation/DB to a known state (e.g. after demo). | `reset()` in simulation only. No DB reset script (e.g. clear localStorage requests, reset live feed). | Medium |
| **Failure-injection scripts** | Scripts or config to inject failures (e.g. for demos). | Manual scenario buttons inject failures in-memory only; no external script or config file. | Low |
| **Supabase backend** | Project scope: "backed by Supabase". | No Supabase in codebase. Data layer is in-memory + localStorage (`src/data/db.ts`). No `createClient` or Supabase usage. | **Critical** |

---

## 11. Page and Navigation Alignment

| Described Page | Expected | Current State | Priority |
|---------------|----------|---------------|----------|
| **Executive Dashboard** | Dedicated executive summary (KPIs, high-level alerts, maybe export). | Closest is "Overview" (MetricsPanel + MapGrid + EventFeed + AIDecisionsPanel). No route named "Executive Dashboard"; no executive-specific export. | High |
| **Network View** | Dedicated network/topology view. | "MAP" shows MapGrid; no separate "Network View" page. | Medium |
| **Simulation Lab** | Dedicated page for running scenarios and controls. | Disruption controls live in Demo/Consumer layout header; simulation runs in same layout. No dedicated "Simulation Lab" page. | Medium |
| **Agent Monitor** | Page to monitor agents (suppliers, trucks, etc.). | TruckStatus + MapGrid + EventFeed give agent-like visibility; no page named "Agent Monitor". | Medium |
| **Explainability** | Dedicated explainability/decision-history page. | Not present (see §5). | High |
| **Analytics** | Dedicated analytics page (charts, reports, exports). | Retailer has reports + Export tab; no global "Analytics" page with KPI charts or governance export. | High |
| **Governance Logs** | Page listing governance/audit logs (decisions, overrides, mode changes) with export. | Not implemented. No Governance Logs page; no audit log of mode changes or manual overrides. | **Critical** |

---

## 12. Known Issues / Frontend–Backend Mismatches

| Issue | Description | Priority |
|------|-------------|----------|
| **Index (ARES) not routed** | Full ARES dashboard (`Index.tsx` with MapGrid, Metrics, EventFeed, AIDecisionsPanel, DisruptionControls, TruckStatus) is not mounted in `App.tsx`. Only `/demo` and `/consumer` sub-routes use SimulationContext and split views (Overview, Map, Fleet, etc.). | Medium |
| **No Supabase** | Scope says "backed by Supabase"; implementation has no Supabase client or Realtime. | **Critical** |
| **Persistence of simulation state** | Simulation state (world, events, decisions) is in-memory only; refresh loses state. No persistence to DB or localStorage for simulation. | High |
| **Governance vs Events** | Events feed shows system events; there is no separate governance/audit log (e.g. who switched mode, who resolved, when). | High |

---

## Summary: Critical Missing Functionality

- **Supabase backend** — entire backend is in-memory + localStorage.
- **Governance Logs** — no page, no audit log, no CSV export.
- **Executive KPI CSV export** — no export of current KPIs from dashboard.
- **Cocoa Shortage / Peanut Contamination** — named scenarios and Cocoa/Peanut agents not present.
- **Realtime backend** — no Supabase (or other) realtime subscriptions for agents/routes/KPIs/events.

---

## Quick Reference Table (by category)

| Category | Missing / Incomplete |
|----------|----------------------|
| Simulation Scenarios | Cocoa Shortage, Peanut Contamination, named presets, reset/failure scripts |
| AI / Decision Engine | Confidence breakdown, risk reduction logs, decision history export |
| Voice / Alerts | Retailer-side voice on resolve (rest implemented) |
| Analytics Exports | Executive KPI CSV, Governance Logs CSV |
| Explainability | Dedicated page, persistence, filters |
| Network Graph | Healthy/Alert/Disrupted/Recovered node colors, edge delay styles, "Network View" page |
| UI/UX | Pulse for disruptions, custom KPI charts |
| Realtime | Backend/Supabase realtime (in-app simulation realtime is done) |
| Retailer/Supplier | Retailer "confirm resolution" (optional) |
| Config / Seed | Cocoa/Peanut agents, DB reset script, Supabase |
| Pages | Executive Dashboard, Network View, Simulation Lab, Agent Monitor, Explainability, Analytics, Governance Logs (as named pages or dedicated features) |
| Known Issues | Index not routed, no Supabase, no simulation persistence, no governance log |

Use this checklist for sprint planning and to track integration of the described scope into the codebase.
