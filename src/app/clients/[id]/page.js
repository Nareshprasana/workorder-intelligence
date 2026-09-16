"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Reveal from "../../../components/dashboard/Reveal";

export default function ClientDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/clients/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load client");
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) return <div className="py-10 text-center text-sm text-slate-500">Loading client...</div>;
  if (error) return <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center text-sm text-red-300">{error}</div>;
  if (!data) return null;

  const client = data.client;
  const recentIncidents = data.recentIncidents || [];

  return (
    <div className="space-y-6">
      <Link href="/clients" className="text-sm text-slate-400 hover:text-white">← Back to Clients</Link>

      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{client.name}</h1>
              {client.companyName && <p className="text-sm text-slate-500">{client.companyName}</p>}
              <p className="mt-1 text-sm text-slate-400">{client.email} · {client.phone}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${client.status === "ACTIVE" ? "border-emerald-900 bg-emerald-950 text-emerald-300" : "border-slate-700 bg-slate-800 text-slate-300"}`}>{client.status}</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-500">Properties</p><p className="text-2xl font-bold text-white">{client.propertyCount}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-500">Open Incidents</p><p className="text-2xl font-bold text-amber-400">{client.openIncidents}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-500">Total Incidents</p><p className="text-2xl font-bold text-white">{client.incidentCount}</p></div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Properties</h2>
            <Link href="/properties/new" className="text-xs text-slate-300 hover:text-white">+ Add Property</Link>
          </div>
          {client.properties.length === 0 ? (
            <p className="mt-4 py-6 text-center text-sm text-slate-500">No properties.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {client.properties.map((p) => (
                <Link key={p.id} href={`/properties/${p.id}`} className="rounded-lg border border-slate-800 bg-slate-950 p-4 hover:border-slate-700 hover:bg-slate-900 transition">
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs font-mono text-slate-500">{p.propertyCode}</p>
                  <p className="mt-1 text-xs text-slate-400">{p.address}</p>
                  <p className="mt-2 text-xs text-slate-500">{p.assetCount} assets · {p.incidentCount} incidents</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Recent Incidents</h2>
          {recentIncidents.length === 0 ? (
            <p className="mt-4 py-6 text-center text-sm text-slate-500">No recent incidents.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {recentIncidents.map((inc) => (
                <div key={inc.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-sm font-medium text-white truncate">{inc.description}</p>
                  <p className="text-xs text-slate-500">{inc.property?.name} · {inc.asset?.assetCode || "No asset"} · {inc.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
