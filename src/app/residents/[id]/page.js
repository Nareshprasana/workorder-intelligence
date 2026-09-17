"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Reveal from "../../../components/dashboard/Reveal";

export default function ResidentDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/residents/${id}`);
      const data = await res.json();
      if (res.ok) setResident(data.resident);
      setLoading(false);
    }
    if (id) load();
  }, [id]);
  if (loading) return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  if (!resident) return <div className="p-6 text-sm text-red-300">Resident not found</div>;
  return (
    <div className="space-y-6">
      <Reveal><Link href="/residents" className="text-sm text-slate-400 hover:text-white">← Back to Residents</Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">{resident.name}</h1>
        <p className="text-sm text-slate-400">{resident.building}, {resident.apartment} · {resident.status}</p>
      </Reveal>
      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Resident Details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Name</p><p className="text-white">{resident.name}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Unit</p><p className="text-white">{resident.apartment}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Building</p><p className="text-white">{resident.building}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Phone</p><p className="text-white">{resident.phone || "—"}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Email</p><p className="text-white">{resident.email || "—"}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Status</p><p className="text-white">{resident.status}</p></div>
          </div>
          <h3 className="mt-6 text-sm font-semibold text-white">Complaints ({resident.incidents?.length || 0})</h3>
          <div className="mt-2 space-y-2">
            {(resident.incidents || []).length === 0 ? <p className="text-xs text-slate-500">No complaints yet.</p> : resident.incidents.map((c) => (
              <Link key={c.id} href={`/complaints/${c.id}`} className="block rounded-lg border border-slate-800 bg-slate-950 p-3 hover:border-slate-700">
                <p className="text-sm text-white">{c.description}</p>
                <p className="text-xs text-slate-500">{c.location} · {c.status} · {new Date(c.createdAt).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
