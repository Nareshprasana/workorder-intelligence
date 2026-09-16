"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Reveal from "../../../components/dashboard/Reveal";
import { ThreeDButton } from "../../../components/dashboard/ThreeDButton";

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/properties/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load property");
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) return <div className="py-10 text-center text-sm text-slate-500">Loading property...</div>;
  if (error) return <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center text-sm text-red-300">{error}</div>;
  if (!data) return null;

  const property = data.property;
  const recentIncidents = data.recentIncidents || [];

  return (
    <div className="space-y-6">
      <Link href="/properties" className="text-sm text-slate-400 hover:text-white">← Back to Properties</Link>

      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{property.name}</h1>
              <p className="text-xs font-mono text-slate-500">{property.propertyCode}</p>
              <p className="mt-1 text-sm text-slate-400">{property.address}</p>
              <p className="mt-1 text-sm text-slate-500">Client: <Link href={`/clients/${property.clientId}`} className="text-slate-300 hover:text-white">{property.client?.name}</Link> {property.client?.status === "INACTIVE" && <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">INACTIVE</span>}</p>
            </div>
            <ThreeDButton href={`/complaints/new?propertyId=${property.id}`} variant="primary">Submit Complaint</ThreeDButton>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-500">Assets</p><p className="text-2xl font-bold text-white">{property.assetCount}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-500">Open Incidents</p><p className="text-2xl font-bold text-amber-400">{property.openIncidents}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><p className="text-xs text-slate-500">Total Incidents</p><p className="text-2xl font-bold text-white">{property.incidentCount}</p></div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Assets</h2>
          {property.assets.length === 0 ? (
            <p className="mt-4 py-6 text-center text-sm text-slate-500">No assets for this property.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {property.assets.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-medium text-white">{a.name}</p>
                  <p className="text-xs font-mono text-slate-500">{a.assetCode} · {a.category}</p>
                  <p className="text-xs text-slate-400">{a.location}</p>
                  <p className="mt-1 text-xs text-slate-500">{a.incidentCount} incidents</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Recent Incidents</h2>
          {recentIncidents.length === 0 ? (
            <p className="mt-4 py-6 text-center text-sm text-slate-500">No incidents.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {recentIncidents.map((inc) => (
                <div key={inc.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-sm font-medium text-white truncate">{inc.description}</p>
                  <p className="text-xs text-slate-500">{inc.asset?.assetCode || "No asset"} · {inc.status} · {inc.reporterName || "Unknown reporter"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
