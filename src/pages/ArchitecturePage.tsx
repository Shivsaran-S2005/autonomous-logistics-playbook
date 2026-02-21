import { motion } from "framer-motion";
import { Box, Users, Brain, Cog, Eye, ArrowDown } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const layers = [
  {
    icon: Box,
    tag: "LAYER 01",
    title: "Digital Twin Simulator",
    color: "primary",
    desc: "A real-time virtual replica of your entire supply chain. Suppliers, warehouses, retailers, and transport — all modeled as live entities with state, behavior, and interactions.",
    details: [
      "Tick-based simulation engine running at configurable speeds",
      "Stochastic demand generation and supplier reliability modeling",
      "Disruption injection: supplier failures, route blockages, demand spikes",
      "Full state history for replay and analysis",
    ],
  },
  {
    icon: Users,
    tag: "LAYER 02",
    title: "Multi-Agent Coordination",
    color: "neon-magenta",
    desc: "Autonomous agents at each supply chain node make independent decisions while coordinating through an event-driven message bus.",
    details: [
      "Supplier Agent: monitors reliability, triggers failover protocols",
      "Warehouse Agent: manages inventory, initiates restocking autonomously",
      "Transport Agent: assigns trucks, optimizes routes, handles rerouting",
      "Coordinator: global event bus for cross-agent communication",
    ],
  },
  {
    icon: Brain,
    tag: "LAYER 03",
    title: "Predictive Intelligence",
    color: "neon-yellow",
    desc: "ML models analyze patterns across inventory levels, demand rates, and supplier behavior to predict disruptions before they materialize.",
    details: [
      "Feature engineering from live simulation state",
      "Shortage prediction with confidence scoring",
      "Anomaly detection across supplier performance metrics",
      "Trend analysis for proactive resource allocation",
    ],
  },
  {
    icon: Cog,
    tag: "LAYER 04",
    title: "Autonomous Decision Engine",
    color: "neon-green",
    desc: "The brain of ARES. Scores available options across reliability, distance, cost, and risk to make optimal decisions in real-time.",
    details: [
      "Multi-criteria scoring: reliability × 5 − distance − cost",
      "Automatic supplier failover when risk exceeds threshold",
      "Dynamic truck rerouting around blocked paths",
      "Decision confidence scoring for transparency",
    ],
  },
  {
    icon: Eye,
    tag: "LAYER 05",
    title: "Human Oversight Layer",
    color: "neon-cyan",
    desc: "Every AI decision is logged with full reasoning. Operators can monitor, audit, and override any autonomous action through the command interface.",
    details: [
      "Explainable AI: every action includes reasoning and impact assessment",
      "Real-time event feed with severity classification",
      "Manual disruption controls for scenario testing",
      "Start / stop / reset simulation with full state control",
    ],
  },
];

const colorMap: Record<string, string> = {
  primary: "border-primary/30 bg-primary/5 text-primary",
  "neon-magenta": "border-secondary/30 bg-secondary/5 text-secondary",
  "neon-yellow": "border-accent/30 bg-accent/5 text-accent",
  "neon-green": "border-neon-green/30 bg-neon-green/5 text-neon-green",
  "neon-cyan": "border-primary/30 bg-primary/5 text-primary",
};

const textColorMap: Record<string, string> = {
  primary: "text-primary",
  "neon-magenta": "text-secondary",
  "neon-yellow": "text-accent",
  "neon-green": "text-neon-green",
  "neon-cyan": "text-primary",
};

const ArchitecturePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.span
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="inline-block font-mono text-[10px] tracking-[0.3em] text-primary mb-4"
        >
          SYSTEM ARCHITECTURE
        </motion.span>
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="font-display text-4xl md:text-5xl mb-6"
        >
          Five Layers of
          <br />
          <span className="text-primary text-glow-cyan">Autonomous Intelligence</span>
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
          className="font-body text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          ARES OS is built as a layered architecture. Each layer operates independently 
          but communicates through a unified event bus.
        </motion.p>
      </section>

      {/* Layers */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        {layers.map((layer, i) => (
          <div key={layer.tag}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="p-8 border border-border bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-start gap-6">
                <div className={`w-12 h-12 border flex items-center justify-center shrink-0 ${colorMap[layer.color]}`}>
                  <layer.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <span className={`font-mono text-[10px] tracking-[0.3em] ${textColorMap[layer.color]}`}>
                    {layer.tag}
                  </span>
                  <h3 className="font-display text-xl tracking-wider mt-1 mb-3">{layer.title}</h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">
                    {layer.desc}
                  </p>
                  <ul className="space-y-2">
                    {layer.details.map((d, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className={`font-mono text-[10px] mt-1 ${textColorMap[layer.color]}`}>▸</span>
                        <span className="font-body text-sm text-foreground/70">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {i < layers.length - 1 && (
              <div className="flex justify-center py-3">
                <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-6xl mx-auto text-center">
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider">
            © 2026 ARES OS — AUTONOMOUS RESILIENT EXECUTION SYSTEM
          </span>
        </div>
      </footer>
    </div>
  );
};

export default ArchitecturePage;
