import { motion, useInView, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({ to, suffix }: { to: number; suffix?: string | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration: 1.8, ease: "easeOut" });
    const unsub = mv.on("change", (v) => setN(Math.round(v)));
    return () => { controls.stop(); unsub(); };
  }, [inView, to, mv]);

  return (
    <span ref={ref}>
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10">
      <Reveal>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h2>
        <div className="mx-auto mt-3 h-1 w-20 rounded-full" style={{ background: "var(--gradient-primary)" }} />
        {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
      </Reveal>
    </div>
  );
}
