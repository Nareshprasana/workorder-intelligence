"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const titleMap = {
  "/": "Dashboard",
  "/incidents": "Incidents",
  "/work-orders": "Work Orders",
  "/workers": "Workers",
  "/workers/new": "New Worker",
  "/assets": "Assets",
  "/ai": "AI Analysis",
  "/sops": "SOPs",
  "/settings": "Settings",
  "/complaints/new": "New Complaint",
};

function getTitle(pathname) {
  if (titleMap[pathname]) return titleMap[pathname];
  if (pathname.startsWith("/workers/") && pathname.includes("/jobs/")) return "Job Detail";
  if (pathname.startsWith("/workers/")) return "Worker Dashboard";
  if (pathname.startsWith("/incidents/")) return "Incident Detail";
  if (pathname.startsWith("/work-orders/")) return "Work Order Detail";
  return "Dashboard";
}

export default function Header({ onMenuClick }) {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <span className="block h-0.5 w-4 bg-current"></span>
          <span className="mt-1 block h-0.5 w-4 bg-current"></span>
          <span className="mt-1 block h-0.5 w-4 bg-current"></span>
        </button>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-white">{title}</h1>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-300">Home</Link>
            {segments.map((seg, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-slate-600">/</span>
                <span className={i === segments.length - 1 ? "text-slate-300" : ""}>{seg}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="sm:hidden">
          <h1 className="text-sm font-semibold text-white">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-500">
          <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Live</span>
          <span className="mx-2 text-slate-700">·</span>
          <span className="hidden lg:inline">Operations Center</span>
        </div>

        <div className="hidden md:block">
          <div className="relative">
            <input
              placeholder="Search incidents, workers..."
              className="w-56 rounded-full border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-slate-300 placeholder:text-slate-600 focus:border-slate-700 focus:outline-none"
            />
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600">⌕</span>
          </div>
        </div>

        <button className="relative rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors" aria-label="Notifications">
          <span className="text-sm">◉</span>
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full border border-slate-950 bg-amber-500"></span>
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 pl-1 pr-3 py-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-300">D</div>
          <span className="text-xs font-medium text-slate-300">Demo User</span>
          <span className="text-xs text-slate-600">▾</span>
        </div>
      </div>
    </header>
  );
}
