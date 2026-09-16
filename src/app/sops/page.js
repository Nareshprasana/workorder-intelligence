"use client";

import { useEffect, useState } from "react";
import Reveal from "../../components/dashboard/Reveal";

export default function SOPsPage() {
  const [sops, setSops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/sops");
      const data = await res.json();
      if (res.ok) setSops(data.sops || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SOPs</h1>
          <p className="text-sm text-slate-400">Standard operating procedures</p>
        </div>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading...</p> : sops.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No SOPs.</p> : sops.map((s) => (
          <Reveal key={s.id}>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700 transition">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{s.title}</p>
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{s.category}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400 line-clamp-4">{s.content}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
