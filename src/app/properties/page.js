"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Reveal from "../../components/dashboard/Reveal";
import { ThreeDButton } from "../../components/dashboard/ThreeDButton";

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/properties");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load properties");
        setProperties(data.properties || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Properties</h1>
            <p className="text-sm text-slate-400">Buildings and sites · Linked to clients and assets</p>
          </div>
          <ThreeDButton href="/properties/new" variant="primary">+ Add Property</ThreeDButton>
        </div>
      </Reveal>

      {loading && <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-500">Loading properties...</div>}
      {error && <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center text-sm text-red-300">{error}</div>}

      {!loading && !error && properties.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">
          <p className="text-sm text-slate-400">No properties yet.</p>
          <Link href="/properties/new" className="mt-3 inline-block text-sm text-slate-300 hover:text-white">Create first property →</Link>
        </div>
      )}

      {!loading && !error && properties.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {properties.map((p) => (
            <Reveal key={p.id}>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/properties/${p.id}`} className="text-sm font-semibold text-white hover:text-slate-200">{p.name}</Link>
                    <p className="text-xs font-mono text-slate-500">{p.propertyCode}</p>
                    <p className="mt-1 text-xs text-slate-400">{p.address}</p>
                    <p className="mt-1 text-xs text-slate-500">Client: <Link href={`/clients/${p.clientId}`} className="text-slate-300 hover:text-white">{p.client?.name}</Link> {p.client?.status === "INACTIVE" && <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">INACTIVE</span>}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>{p.assetCount} assets</span>
                  <span>·</span>
                  <span className={p.openIncidents > 0 ? "text-amber-400" : ""}>{p.openIncidents} open</span>
                  <span>·</span>
                  <span>{p.incidentCount} total incidents</span>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href={`/properties/${p.id}`} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800">View</Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
