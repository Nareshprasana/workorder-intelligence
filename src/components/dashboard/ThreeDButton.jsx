"use client";

import Link from "next/link";

export function ThreeDButton({ children, href, onClick, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:translate-y-px";
  const styles = {
    primary:
      "bg-white text-slate-900 shadow-[0_4px_0_0_rgb(15_23_42),0_4px_12px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_rgb(15_23_42),0_8px_16px_rgba(0,0,0,0.3)] active:shadow-[0_1px_0_0_rgb(15_23_42)] border border-slate-200",
    secondary:
      "bg-slate-900 text-white border border-slate-700 shadow-[0_3px_0_0_rgb(30_41_59),0_3px_8px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_rgb(30_41_59)] active:shadow-[0_1px_0_0_rgb(30_41_59)] hover:bg-slate-800",
    ghost:
      "bg-transparent text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white",
  };
  const cls = `${base} ${styles[variant] || styles.primary} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls} {...props}>
      {children}
    </button>
  );
}
