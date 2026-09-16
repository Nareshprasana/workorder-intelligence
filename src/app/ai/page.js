"use client";

import { useEffect, useState } from "react";
import Reveal from "../../components/dashboard/Reveal";

export default function AIPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/incidents?limit=20");
      const data = await res.json();
      if (res.ok) setIncidents((data.incidents || []).filter((i) => i.aiAnalysis || i.category));
      setLoading(false);
    }
    load();
  }, []);

  const total = incidents.length;
  const needsInfo = incidents.filter((i) => i.status === "NEEDS_INFORMATION").length;
  const highCritical = incidents.filter((i) => i.severity === "HIGH" || i.severity === "CRITICAL").length;

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Analysis</h1>
          <p className="text-sm text-slate-400">AI understands · Rules decide · Workers execute</p>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-3">
        <Reveal><div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-xs text-slate-400">Analyzed</p><p className="mt-1 text-2xl font-bold text-white">{loading ? "—" : total}</p></div></Reveal>
        <Reveal delay={60}><div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-5"><p className="text-xs text-amber-300/80">Needs Information</p><p className="mt-1 text-2xl font-bold text-amber-400">{loading ? "—" : needsInfo}</p></div></Reveal>
        <Reveal delay={120}><div className="rounded-xl border border-red-900/50 bg-red-950/20 p-5"><p className="text-xs text-red-300/80">High / Critical</p><p className="mt-1 text-2xl font-bold text-red-400">{loading ? "—" : highCritical}</p></div></Reveal>
      </div>

      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Recent AI Analyses</h2>
          <p className="text-xs text-slate-500">Stored aiAnalysis · No Gemini call</p>
          <div className="mt-4 space-y-3">
            {loading ? <p className="py-6 text-center text-sm text-slate-500">Loading...</p> : incidents.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No analyses.</p> : incidents.map((inc) => {
              let analysis = null;
              try { analysis = inc.aiAnalysis ? JSON.parse(inc.aiAnalysis) : null; } catch {}
              return (
                <div key={inc.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white">{inc.issue || inc.description.slice(0, 60)}</p>
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{inc.category} · {inc.severity}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{inc.location} · {inc.confidence ? `${Math.round(inc.confidence*100)}% confidence` : ""}</p>
                  <p className="mt-2 text-xs text-slate-300"><span className="text-slate-500">Recommendation:</span> {inc.recommendedAction || "—"}</p>
                  {analysis?.missingInformation?.length > 0 && <p className="mt-1 text-xs text-amber-400">Missing: {analysis.missingInformation.join(", ")}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
