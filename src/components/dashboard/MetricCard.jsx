"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";

export default function MetricCard({ icon, label, value, sublabel, accent = "slate" }) {
  const ref = useRef(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setDisplayValue(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 700;
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, hasAnimated]);

  const accentBorder = {
    slate: "border-slate-800 hover:border-slate-700",
    emerald: "border-slate-800 hover:border-emerald-900/50",
    amber: "border-slate-800 hover:border-amber-900/50",
    red: "border-slate-800 hover:border-red-900/50",
    blue: "border-slate-800 hover:border-sky-900/50",
  }[accent] || "border-slate-800 hover:border-slate-700";

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-xl border bg-slate-900 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${accentBorder}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{displayValue}</p>
          {sublabel && <p className="mt-1 text-xs text-slate-500">{sublabel}</p>}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 group-hover:text-slate-200 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
}
