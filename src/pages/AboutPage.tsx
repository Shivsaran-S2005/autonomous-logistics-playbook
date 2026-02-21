import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, Clock, Bot, Cpu, GitBranch, CheckCircle2 } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const problems = [
  {
    icon: AlertTriangle,
    title: "Cascading Failures",
    desc: "A single supplier outage triggers warehouse stockouts, delayed shipments, and lost revenue across the network.",
  },
  {
    icon: TrendingDown,
    title: "Reactive, Not Proactive",
    desc: "Traditional systems detect problems after they've already caused damage. Response times are measured in hours, not seconds.",
  },
  {
    icon: Clock,
    title: "Human Bottlenecks",
    desc: "Critical rerouting decisions wait for manual approval while disruptions compound. Every minute of delay multiplies losses.",
  },
];

const approach = [
  {
    icon: Bot,
    title: "Agentic AI",
    desc: "Autonomous agents at each node — suppliers, warehouses, transport — make local decisions that serve global optimization.",
  },
  {
    icon: Cpu,
    title: "Predictive Models",
    desc: "Machine learning detects anomalies and predicts shortages before they materialize, enabling preemptive action.",
  },
  {
    icon: GitBranch,
    title: "Self-Healing Coordination",
    desc: "When disruption strikes, agents communicate, reallocate resources, and reroute logistics autonomously.",
  },
];

const benefits = [
  "Prevent 94% of stockout events before they impact customers",
  "Reduce disruption recovery time by 3.2x",
  "Full explainability — every AI decision is logged with reasoning",
  "Sub-200ms decision latency for real-time response",
  "Simulate and stress-test your supply chain with digital twin",
  "Human oversight layer for critical override control",
];

const AboutPage = () => {
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
          ABOUT ARES OS
        </motion.span>
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="font-display text-4xl md:text-5xl mb-6"
        >
          Why Supply Chains Need
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
          Global supply chains are more complex and fragile than ever. ARES OS brings 
          agentic AI to logistics — not to replace humans, but to give them superpowers.
        </motion.p>
      </section>

      {/* Problem section */}
      <section className="border-y border-border bg-card/30">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-12"
          >
            <span className="font-mono text-[10px] tracking-[0.3em] text-neon-red">01 — THE PROBLEM</span>
            <h2 className="font-display text-3xl mt-3">
              Modern Supply Chains Are Built to Break
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {problems.map((p, i) => (
              <motion.div
                key={p.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="space-y-3"
              >
                <div className="w-10 h-10 border border-neon-red/30 flex items-center justify-center bg-neon-red/5">
                  <p.icon className="w-5 h-5 text-neon-red" />
                </div>
                <h3 className="font-display text-sm tracking-wider">{p.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Approach section */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] text-primary">02 — OUR APPROACH</span>
          <h2 className="font-display text-3xl mt-3">
            Agentic AI for Logistics
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {approach.map((a, i) => (
            <motion.div
              key={a.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i + 1}
              className="p-6 border border-border bg-card/30 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 border border-primary/30 flex items-center justify-center bg-primary/5 mb-4">
                <a.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-sm tracking-wider mb-2">{a.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-12"
          >
            <span className="font-mono text-[10px] tracking-[0.3em] text-neon-green">03 — BENEFITS</span>
            <h2 className="font-display text-3xl mt-3">
              What ARES Delivers
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex items-start gap-3 p-4 border border-border/50 bg-card/20"
              >
                <CheckCircle2 className="w-4 h-4 text-neon-green mt-0.5 shrink-0" />
                <span className="font-body text-sm text-foreground/80">{b}</span>
              </motion.div>
            ))}
          </div>
        </div>
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

export default AboutPage;
