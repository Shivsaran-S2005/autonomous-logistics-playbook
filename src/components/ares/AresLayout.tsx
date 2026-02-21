import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useSimulationContext } from "@/contexts/SimulationContext";
import { DisruptionControls } from "./DisruptionControls";
import { Map, Truck, Package, Activity, Brain, LayoutDashboard } from "lucide-react";

const navItems = [
  { label: "OVERVIEW", path: "/", icon: LayoutDashboard },
  { label: "MAP", path: "/map", icon: Map },
  { label: "FLEET", path: "/fleet", icon: Truck },
  { label: "INVENTORY", path: "/inventory", icon: Package },
  { label: "EVENTS", path: "/events", icon: Activity },
  { label: "AI BRAIN", path: "/ai", icon: Brain },
];

export function AresLayout() {
  const { world, start, stop, reset, triggerDisruption, clearDisruption, triggerManualScenario } = useSimulationContext();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background cyber-grid-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl text-neon-cyan text-glow-cyan tracking-[0.3em]">
            // ARES
          </span>
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider hidden md:inline">
            AUTONOMOUS RESILIENT EXECUTION SYSTEM
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-muted-foreground">v1.0.77</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${world.running ? "bg-neon-green animate-pulse-glow" : "bg-muted-foreground"}`} />
            <span className="font-mono text-[10px] text-neon-cyan">
              {world.running ? "ONLINE" : "STANDBY"}
            </span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border px-4 shrink-0 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className="flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] tracking-wider border-b-2 border-transparent transition-all hover:text-neon-cyan hover:bg-neon-cyan/5"
                activeClassName="text-neon-cyan text-glow-cyan border-b-2 !border-neon-cyan bg-neon-cyan/5"
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Controls (always visible) */}
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

      {/* Page content */}
      <main className="flex-1 p-4 min-h-0">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-2 flex justify-between font-mono text-[9px] text-muted-foreground shrink-0">
        <span>[ ARES DIGITAL TWIN — SUPPLY CHAIN INTELLIGENCE ]</span>
        <span>TICK {world.tick} | {new Date().toLocaleTimeString("en", { hour12: false })}</span>
      </footer>
    </div>
  );
}
