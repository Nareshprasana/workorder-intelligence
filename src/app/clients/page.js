"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Reveal from "../../components/dashboard/Reveal";
import { ThreeDButton } from "../../components/dashboard/ThreeDButton";

function StatusBadge({ status }) {
  const map = {
    ACTIVE: "border-emerald-900 bg-emerald-950 text-emerald-300",
    INACTIVE: "border-slate-700 bg-slate-800 text-slate-300",
  };
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status] || map.INACTIVE}`}>{status}</span>;
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load clients");
        setClients(data.clients || []);
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
            <h1 className="text-2xl font-bold tracking-tight text-white">Clients</h1>
            <p className="text-sm text-slate-400">Property owners and managers · Ownership validated server-side</p>
          </div>
          <ThreeDButton href="/clients/new" variant="primary">+ Add Client</ThreeDButton>
        </div>
      </Reveal>

      {loading && <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-500">Loading clients...</div>}
      {error && <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center text-sm text-red-300">{error}</div>}

      {!loading && !error && clients.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">
          <p className="text-sm text-slate-400">No clients yet.</p>
          <Link href="/clients/new" className="mt-3 inline-block text-sm text-slate-300 hover:text-white">Create first client →</Link>
        </div>
      )}

      {!loading && !error && clients.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {clients.map((c) => (
            <Reveal key={c.id}>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    {c.companyName && <p className="text-xs text-slate-500">{c.companyName}</p>}
                    <p className="mt-1 text-xs text-slate-400">{c.email} · {c.phone}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                  <span>{c.propertyCount} properties</span>
                  <span>·</span>
                  <span>{c.incidentCount} incidents</span>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href={`/clients/${c.id}`} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800">
                    View
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
