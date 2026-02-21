import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Brain, Zap, Eye, Network, BarChart3 } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const features = [
  {
    icon: Brain,
    title: "Predictive Intelligence",
    desc: "ML models detect supply chain failures before they happen, giving you minutes — not hours — of lead time.",
  },
  {
    icon: Network,
    title: "Multi-Agent Coordination",
    desc: "Autonomous agents manage suppliers, warehouses, and transport in real-time without human bottlenecks.",
  },
  {
    icon: Shield,
    title: "Self-Healing Logistics",
    desc: "When disruption strikes, ARES reroutes, reallocates, and recovers autonomously.",
  },
  {
    icon: Eye,
    title: "Full Observability",
    desc: "Every AI decision is logged, explained, and auditable. No black-box operations.",
  },
  {
    icon: BarChart3,
    title: "Digital Twin Simulation",
    desc: "Test scenarios, inject chaos, and validate resilience before deploying to production.",
  },
  {
    icon: Zap,
    title: "Zero-Latency Decisions",
    desc: "Sub-second decision cycles keep your supply chain ahead of cascading failures.",
  },
];

const stats = [
  { value: "99.7%", label: "Uptime" },
  { value: "<200ms", label: "Decision Latency" },
  { value: "94%", label: "Stockouts Prevented" },
  { value: "3.2x", label: "Recovery Speed" },
];

const HomePage = () => {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated grid bg */}
        <div className="absolute inset-0 cyber-grid-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="mb-6"
          >
            <span className="inline-block font-mono text-[10px] tracking-[0.4em] text-primary/70 border border-primary/20 px-4 py-1.5 bg-primary/5">
              AUTONOMOUS RESILIENT EXECUTION SYSTEM
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-6"
          >
            <span className="text-foreground">Self-Healing</span>
            <br />
            <span className="text-primary text-glow-cyan">Supply Chain</span>
            <br />
            <span className="text-foreground">Intelligence</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            ARES OS is an AI-powered digital twin that predicts disruptions, coordinates autonomous agents, 
            and heals your logistics network in real-time — before failures cascade.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/demo"
              className="group flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-display text-sm tracking-wider hover:shadow-[var(--glow-cyan)] transition-all duration-300"
            >
              LAUNCH LIVE SYSTEM
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/architecture"
              className="flex items-center gap-2 px-8 py-3.5 border border-border text-foreground font-display text-sm tracking-wider hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
            >
              VIEW ARCHITECTURE
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="text-center"
            >
              <div className="font-display text-3xl md:text-4xl text-primary text-glow-cyan font-bold">
                {s.value}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground tracking-wider mt-1">
                {s.label.toUpperCase()}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-16"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] text-secondary">THE PROBLEM</span>
          <h2 className="font-display text-3xl md:text-4xl mt-3 mb-4">
            Supply Chains Are Fragile
          </h2>
          <p className="font-body text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            A single supplier failure can cascade into millions in losses. Traditional systems react too late. 
            By the time humans detect a disruption, the damage is done.
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-16"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] text-primary">THE SOLUTION</span>
          <h2 className="font-display text-3xl md:text-4xl mt-3">
            Autonomous Intelligence at Every Node
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="group p-6 border border-border bg-card/30 hover:border-primary/30 hover:bg-card/60 transition-all duration-300"
            >
              <div className="w-10 h-10 border border-primary/30 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-sm tracking-wider mb-2">{f.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-3xl md:text-4xl mb-4">
              See It In Action
            </h2>
            <p className="font-body text-muted-foreground mb-8 text-lg">
              Enter the live simulation. Trigger disruptions. Watch the AI heal.
            </p>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground font-display text-sm tracking-wider hover:shadow-[var(--glow-cyan)] transition-all duration-300"
            >
              ENTER COMMAND CENTER
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider">
            © 2026 ARES OS — AUTONOMOUS RESILIENT EXECUTION SYSTEM
          </span>
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider">
            DIGITAL TWIN INTELLIGENCE PLATFORM
          </span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
