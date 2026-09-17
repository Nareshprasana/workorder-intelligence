"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    label: "OVERVIEW",
    items: [{ name: "Dashboard", href: "/", icon: "◈" }],
  },
  {
    label: "PEOPLE",
    items: [
      { name: "Residents", href: "/residents", icon: "◉" },
      { name: "Workers", href: "/workers", icon: "◎" },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { name: "Complaints", href: "/incidents", icon: "⚑" },
      { name: "Work Requests", href: "/work-orders", icon: "⧉" },
    ],
  },
  {
    label: "AI",
    items: [{ name: "AI Analysis", href: "/ai", icon: "✦" }],
  },
  {
    label: "SYSTEM",
    items: [{ name: "Settings", href: "/settings", icon: "⚙" }],
  },
];

function NavItem({ item, active }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md border text-xs transition-colors" style={{
        borderColor: active ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)",
        background: active ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"
      }}>
        {item.icon}
      </span>
      {item.name}
    </Link>
  );
}

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6">
        <Link href="/" className="block">
          <p className="text-sm font-semibold tracking-tight text-white leading-none">WorkOrder</p>
          <p className="text-sm font-light tracking-wide text-slate-400 leading-none">Intelligence</p>
        </Link>
        <p className="mt-2 text-xs text-slate-500">Operations Center</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="mb-2 px-3 text-xs font-semibold tracking-widest text-slate-500">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return <NavItem key={item.href} item={item} active={active} />;
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 px-4 py-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <p className="text-xs font-medium text-slate-300">AI Engine Online</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">All systems operational</p>
        </div>
        <p className="mt-3 px-1 text-xs text-slate-600">v1.0 · Demo Operations</p>
        <p className="mt-1 px-1 text-xs text-slate-600">Production would add authenticated resident and worker accounts with role-based authorization.</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-800 lg:bg-slate-950">
        {content}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-slate-800 bg-slate-950 shadow-xl">
            <div className="flex h-12 items-center justify-between border-b border-slate-800 px-4">
              <span className="text-sm font-semibold text-white">Menu</span>
              <button
                onClick={onClose}
                className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100%-48px)] overflow-y-auto">{content}</div>
          </div>
        </div>
      )}
    </>
  );
}
