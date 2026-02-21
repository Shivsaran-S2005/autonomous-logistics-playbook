import { Outlet } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useSimulationContext } from "@/contexts/SimulationContext";
import { DisruptionControls } from "@/components/ares/DisruptionControls";
import { Map, Truck, Package, Activity, Brain, LayoutDashboard, Candy, Inbox, AlertTriangle } from "lucide-react";

const navItems = [
  { label: "OVERVIEW", path: "/consumer", icon: LayoutDashboard },
  { label: "MAP", path: "/consumer/map", icon: Map },
  { label: "LIVE", path: "/consumer/live", icon: AlertTriangle },
  { label: "FLEET", path: "/consumer/fleet", icon: Truck },
  { label: "INVENTORY", path: "/consumer/inventory", icon: Package },
  { label: "PRODUCTS", path: "/consumer/products", icon: Candy },
  { label: "REQUESTS", path: "/consumer/requests", icon: Inbox },
  { label: "EVENTS", path: "/consumer/events", icon: Activity },
  { label: "AI BRAIN", path: "/consumer/ai", icon: Brain },
];

export default function ConsumerPortalLayout() {
  const { world, start, stop, reset, triggerDisruption, clearDisruption, triggerManualScenario } = useSimulationContext();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background cyber-grid-bg flex flex-col">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl text-primary text-glow-cyan tracking-[0.3em]">
            // SUPPLIER
          </span>
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider hidden md:inline">
            LIVE DEMO & MANUAL HANDLING
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-muted-foreground">v1.0.77</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${world.running ? "bg-neon-green animate-pulse-glow" : "bg-muted-foreground"}`} />
            <span className="font-mono text-[10px] text-primary">
              {world.running ? "ONLINE" : "STANDBY"}
            </span>
          </div>
        </div>
      </header>

      <nav className="border-b border-border px-4 shrink-0 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/consumer"}
              className="flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] tracking-wider border-b-2 border-transparent transition-all hover:text-primary hover:bg-primary/5"
              activeClassName="text-primary text-glow-cyan border-b-2 !border-primary bg-primary/5"
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="px-4 pt-3 shrink-0">
        <DisruptionControls
          world={world}
          onStart={start}
          onStop={stop}
          onReset={reset}
          onTriggerDisruption={triggerDisruption}
          onClearDisruption={clearDisruption}
          onTriggerManualScenario={triggerManualScenario}
        />
      </div>

      <main className="flex-1 p-4 min-h-0">
        <Outlet />
      </main>

      <footer className="border-t border-border px-6 py-2 flex justify-between font-mono text-[9px] text-muted-foreground shrink-0">
        <span>[ SUPPLIER — LIVE DEMO & MANUAL HANDLING ]</span>
        <span>TICK {world.tick} | {new Date().toLocaleTimeString("en", { hour12: false })}</span>
      </footer>
    </div>
  );
}
