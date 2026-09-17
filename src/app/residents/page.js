"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Reveal from "../../components/dashboard/Reveal";

export default function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/residents");
      const data = await res.json();
      if (res.ok) setResidents(data.residents || []);
      setLoading(false);
    }
    load();
  }, []);
  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Residents</h1>
            <p className="text-sm text-slate-400">{residents.length} residents · Resident → Complaint → AI → Worker</p>
          </div>
          <Link href="/residents/new" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 shadow-[0_3px_0_0_rgb(15_23_42)]">+ Add Resident</Link>
        </div>
      </Reveal>
      <Reveal>
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Complaints</th>
                  <th className="px-4 py-3 font-medium">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">Loading...</td></tr> : residents.length === 0 ? <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">No residents.</td></tr> : residents.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                    <td className="px-4 py-3 text-slate-400">{r.apartment}</td>
                    <td className="px-4 py-3 text-slate-400">{r.building}</td>
                    <td className="px-4 py-3 text-slate-400">{r.phone || "—"}</td>
                    <td className="px-4 py-3 text-slate-400">{r.email || "—"}</td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${r.status === "ACTIVE" ? "border-emerald-900 bg-emerald-950 text-emerald-300" : "border-slate-700 bg-slate-800 text-slate-400"}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-slate-400 text-center">{r._count?.incidents ?? 0}</td>
                    <td className="px-4 py-3"><Link href={`/residents/${r.id}`} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
