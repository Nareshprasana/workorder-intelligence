"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";

export default function ProgressBar({ value = 0, max = 100, color = "emerald", className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPrefersReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const width = visible || prefersReduced ? `${percent}%` : "0%";

  const colorMap = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    blue: "bg-sky-500",
    slate: "bg-slate-400",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    orange: "bg-orange-500",
    gray: "bg-slate-500",
  };
  const barColor = colorMap[color] || colorMap.slate;

  return (
    <div ref={ref} className={`h-1.5 w-full overflow-hidden rounded-full bg-slate-800 ${className}`}>
      <div
        className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
        style={{ width, transitionDuration: prefersReduced ? "0ms" : "700ms" }}
      />
    </div>
  );
}
