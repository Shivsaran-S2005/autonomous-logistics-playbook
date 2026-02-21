import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Architecture", path: "/architecture" },
  { label: "Operations", path: "/demo" },
  { label: "Supplier", path: "/consumer" },
  { label: "Portal", path: "/login" },
];

export function SiteNavbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isDemoPage = location.pathname.startsWith("/demo");

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300",
      isDemoPage
        ? "border-border bg-background/95 backdrop-blur-md"
        : "border-border/40 bg-background/80 backdrop-blur-xl"
    )}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 border border-primary/60 flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-colors">
            <span className="font-display text-[10px] text-primary text-glow-cyan font-bold">A</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm text-primary text-glow-cyan tracking-[0.25em] leading-none">
              ARES OS
            </span>
            <span className="font-mono text-[8px] text-muted-foreground tracking-wider hidden sm:block">
              AUTONOMOUS RESILIENT EXECUTION
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(link => {
            const isActive = location.pathname === link.path || 
              (link.path === "/demo" && location.pathname.startsWith("/demo"));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-4 py-2 font-mono text-xs tracking-wider transition-all duration-200",
                  isActive
                    ? "text-primary text-glow-cyan bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label.toUpperCase()}
              </Link>
            );
          })}
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          {links.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setOpen(false)}
              className="block px-6 py-3 font-mono text-xs tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 border-b border-border/30"
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
