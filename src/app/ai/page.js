"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Reveal from "../../components/dashboard/Reveal";

export default function AIPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/incidents?limit=20");
      const data = await res.json();
      if (res.ok) setIncidents(data.incidents || []);
      setLoading(false);
    }
    load();
  }, []);

  const analyzing = incidents.filter((i) => i.status === "ANALYZING");
  const needsInfo = incidents.filter((i) => i.status === "NEEDS_INFORMATION");
  const ready = incidents.filter((i) => i.status === "READY");
  const completed = incidents.filter((i) => ["ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(i.status));
  const analyzed = incidents.filter((i) => i.aiAnalysis || i.category);

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Analysis</h1>
          <p className="text-sm text-slate-400">AI understands · Rules decide · Workers execute · No Gemini call from this dashboard</p>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-4">
        <Reveal>
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-5">
            <p className="text-xs text-amber-300/80">Analyzing</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">{loading ? "—" : analyzing.length}</p>
            <p className="text-xs text-slate-500">Indeterminate · animated dot</p>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-5">
            <p className="text-xs text-amber-300/80">Needs Information</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">{loading ? "—" : needsInfo.length}</p>
            <p className="text-xs text-slate-500">⚠ Missing fields</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-5">
            <p className="text-xs text-emerald-300/80">Ready</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{loading ? "—" : ready.length}</p>
            <p className="text-xs text-slate-500">Ready for work order</p>
          </div>
        </Reveal>
        <Reveal delay={180}>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs text-slate-400">Operationalized</p>
            <p className="mt-1 text-2xl font-bold text-white">{loading ? "—" : completed.length}</p>
            <p className="text-xs text-slate-500">Assigned / In Progress / Completed</p>
          </div>
        </Reveal>
      </div>

      {/* Analyzing Section */}
      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </span>
            Analyzing
          </h2>
          <p className="text-xs text-slate-500">AI analysis in progress · indeterminate animation</p>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading...</p>
            ) : analyzing.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No incidents analyzing.</p>
            ) : (
              analyzing.map((inc) => (
                <Link key={inc.id} href={`/incidents/${inc.id}`} className="flex gap-3 rounded-lg border border-amber-900/50 bg-amber-950/10 p-4 hover:bg-amber-950/20 transition">
                  <span className="relative flex h-2 w-2 mt-1 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{inc.description.slice(0, 80)}</p>
                    <p className="text-xs text-slate-500">{inc.location} · AI analyzing...</p>
                  </div>
                  <span className="ml-auto text-xs text-amber-300">ANALYZING</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </Reveal>

      {/* Needs Information */}
      <Reveal>
        <div className="rounded-xl border border-amber-900/30 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Needs Information</h2>
          <p className="text-xs text-slate-500">AI knows when it does not have enough information</p>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading...</p>
            ) : needsInfo.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No incidents need information.</p>
            ) : (
              needsInfo.map((inc) => {
                let missing = [];
                try {
                  const parsed = inc.aiAnalysis ? JSON.parse(inc.aiAnalysis) : null;
                  missing = parsed?.missingInformation || [];
                } catch {}
                return (
                  <Link key={inc.id} href={`/incidents/${inc.id}`} className="block rounded-lg border border-amber-900/40 bg-slate-950 p-4 hover:border-amber-800/50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white">{inc.issue || inc.description.slice(0, 60)}</p>
                      <span className="rounded-full border border-amber-900 bg-amber-950 px-2 py-0.5 text-xs text-amber-300">NEEDS INFORMATION</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{inc.category} · {inc.severity} · {inc.confidence ? `${Math.round(inc.confidence * 100)}%` : ""}</p>
                    {missing.length > 0 && <p className="mt-1 text-xs text-amber-400">Missing: {missing.join(", ")}</p>}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </Reveal>

      {/* Ready */}
      <Reveal>
        <div className="rounded-xl border border-emerald-900/30 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Ready</h2>
          <p className="text-xs text-slate-500">AI analysis complete — ready for work order (deterministic rules)</p>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading...</p>
            ) : ready.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No ready incidents.</p>
            ) : (
              ready.map((inc) => (
                <Link key={inc.id} href={`/incidents/${inc.id}`} className="block rounded-lg border border-emerald-900/40 bg-slate-950 p-4 hover:border-emerald-800/50 transition">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white">{inc.issue || inc.description.slice(0, 60)}</p>
                    <span className="rounded-full border border-emerald-900 bg-emerald-950 px-2 py-0.5 text-xs text-emerald-300">READY ✓</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{inc.category} · {inc.severity} · {inc.confidence ? `${Math.round(inc.confidence * 100)}%` : ""}</p>
                  <p className="mt-1 text-xs text-slate-300">{inc.recommendedAction || "—"}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      </Reveal>

      {/* Completed / Operationalized */}
      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Recent AI Analyses (Operationalized)</h2>
          <p className="text-xs text-slate-500">Stored aiAnalysis · No Gemini call from dashboard</p>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading...</p>
            ) : analyzed.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No analyses.</p>
            ) : (
              analyzed.slice(0, 6).map((inc) => {
                let analysis = null;
                try {
                  analysis = inc.aiAnalysis ? JSON.parse(inc.aiAnalysis) : null;
                } catch {}
                return (
                  <div key={inc.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white">{inc.issue || inc.description.slice(0, 60)}</p>
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{inc.category} · {inc.severity} · {inc.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{inc.location} · {inc.confidence ? `${Math.round(inc.confidence * 100)}% confidence` : ""}</p>
                    <p className="mt-2 text-xs text-slate-300"><span className="text-slate-500">Recommendation:</span> {inc.recommendedAction || "—"}</p>
                    {analysis?.missingInformation?.length > 0 && <p className="mt-1 text-xs text-amber-400">Missing: {analysis.missingInformation.join(", ")}</p>}
                    <Link href={`/incidents/${inc.id}`} className="mt-2 inline-block text-xs text-sky-400 hover:text-sky-300">View detail →</Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
