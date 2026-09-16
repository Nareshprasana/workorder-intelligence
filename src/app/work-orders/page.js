"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import Link from "next/link";
import { useEffect, useState } from "react";
import Reveal from "../../components/dashboard/Reveal";

const statuses = ["ALL","PENDING","ASSIGNED","IN_PROGRESS","COMPLETED","CANCELLED"];

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    const res = await fetch(`/api/work-orders?${params}`);
    const data = await res.json();
    if (res.ok) setWorkOrders(data.workOrders || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Work Orders</h1>
            <p className="text-sm text-slate-400">Deterministic assignment · SLA tracked</p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === s ? "border-white bg-white text-slate-900" : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Issue</th>
                  <th className="px-4 py-3 font-medium">Worker</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">SLA</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">Loading...</td></tr>
                ) : workOrders.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No work orders.</td></tr>
                ) : workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-800/40">
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-medium text-white">{wo.incident?.issue || wo.description.slice(0, 50)}</p>
                      <p className="truncate text-xs text-slate-500">{wo.incident?.location}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {wo.worker ? <Link href={`/workers/${wo.worker.id}`} className="hover:text-white hover:underline">{wo.worker.name}</Link> : <span className="text-amber-400">Pending</span>}
                    </td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${wo.priority === "CRITICAL" ? "border-red-900 bg-red-950 text-red-300" : wo.priority === "HIGH" ? "border-orange-900 bg-orange-950 text-orange-300" : "border-slate-700 bg-slate-800 text-slate-300"}`}>{wo.priority}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{wo.slaHours}h</td>
                    <td className="px-4 py-3"><span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{wo.status}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(wo.createdAt).toLocaleDateString()}</td>
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
