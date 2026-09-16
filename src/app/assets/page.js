"use client";

import { useEffect, useState } from "react";
import Reveal from "../../components/dashboard/Reveal";

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/assets");
      const data = await res.json();
      if (res.ok) setAssets(data.assets || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Assets</h1>
          <p className="text-sm text-slate-400">Registered facility assets</p>
        </div>
      </Reveal>
      <Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-10 text-center text-sm text-slate-500">Loading...</div>
          ) : assets.length === 0 ? (
            <div className="col-span-full py-10 text-center text-sm text-slate-500">No assets.</div>
          ) : assets.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{a.name}</p>
                  <p className="text-xs font-mono text-slate-500">{a.assetCode}</p>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{a.category}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{a.location}</p>
              {a.description && <p className="mt-2 text-xs text-slate-500">{a.description}</p>}
              <p className="mt-3 text-xs text-slate-600">{a._count?.incidents ?? 0} incidents</p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
