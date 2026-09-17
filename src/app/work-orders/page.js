"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import Link from "next/link";
import { useEffect, useState } from "react";
import Reveal from "../../components/dashboard/Reveal";

const statuses = ["ALL","PENDING","ASSIGNED","IN_PROGRESS","COMPLETED","CANCELLED"];

function assignmentLabel(wo) {
  if (wo.status === "PENDING") return "Awaiting worker assignment";
  if (wo.status === "ASSIGNED" && wo.worker) return `Assigned to ${wo.worker.name}`;
  if (wo.status === "IN_PROGRESS" && wo.worker) return `${wo.worker.name} is working`;
  if (wo.status === "COMPLETED" && wo.worker) return `Completed by ${wo.worker.name}`;
  if (wo.worker) return wo.worker.name;
  return "Awaiting worker assignment";
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [assignId, setAssignId] = useState(null);
  const [eligible, setEligible] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [msg, setMsg] = useState("");

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

  async function openAssign(woId) {
    setAssignId(woId);
    setEligible([]);
    setMsg("");
    try {
      const res = await fetch(`/api/work-orders/${woId}/assign`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load eligible workers");
      setEligible(data.eligibleWorkers || []);
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function doAssign(workerId) {
    if (!assignId) return;
    setAssigning(true);
    setMsg("");
    try {
      const res = await fetch(`/api/work-orders/${assignId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assign failed");
      setMsg(`Assigned to ${data.workOrder.worker.name}`);
      setAssignId(null);
      load();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Work Orders</h1>
            <p className="text-sm text-slate-400">Deterministic assignment · SLA tracked · Assignment status visible</p>
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

      {msg && <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-300">{msg}</div>}

      <Reveal>
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Issue</th>
                  <th className="px-4 py-3 font-medium">Assignment</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">SLA</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">Loading...</td></tr>
                ) : workOrders.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No work orders.</td></tr>
                ) : workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-800/40">
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-medium text-white">{wo.incident?.issue || wo.description.slice(0, 50)}</p>
                      <p className="truncate text-xs text-slate-500">{wo.incident?.resident ? `${wo.incident.resident.name} · ${wo.incident.resident.building}, ${wo.incident.resident.apartment}` : wo.incident?.location}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {wo.status === "PENDING" ? <span className="font-medium text-amber-400">Awaiting worker assignment</span> : wo.status === "ASSIGNED" && wo.worker ? <span className="font-medium text-sky-300">Assigned to {wo.worker.name}</span> : wo.status === "IN_PROGRESS" && wo.worker ? <span className="font-medium text-blue-300">{wo.worker.name} is working</span> : wo.status === "COMPLETED" && wo.worker ? <span className="font-medium text-emerald-300">Completed by {wo.worker.name}</span> : wo.worker ? <Link href={`/workers/${wo.worker.id}`} className="text-slate-300 hover:text-white hover:underline">{wo.worker.name}</Link> : <span className="text-amber-400">Awaiting worker</span>}
                    </td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${wo.priority === "CRITICAL" ? "border-red-900 bg-red-950 text-red-300" : wo.priority === "HIGH" ? "border-orange-900 bg-orange-950 text-orange-300" : "border-slate-700 bg-slate-800 text-slate-300"}`}>{wo.priority}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{wo.slaHours}h</td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${wo.status === "IN_PROGRESS" ? "border-blue-900 bg-blue-950 text-blue-300" : wo.status === "ASSIGNED" ? "border-sky-900 bg-sky-950 text-sky-300" : wo.status === "PENDING" ? "border-amber-900 bg-amber-950 text-amber-300" : wo.status === "COMPLETED" ? "border-emerald-900 bg-emerald-950 text-emerald-300" : "border-slate-700 bg-slate-800 text-slate-300"}`}>{wo.status}</span></td>
                    <td className="px-4 py-3">
                      {wo.status === "PENDING" ? (
                        <button onClick={() => openAssign(wo.id)} className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-900 hover:bg-slate-200">Assign Worker</button>
                      ) : wo.worker ? (
                        <Link href={`/workers/${wo.worker.id}/jobs/${wo.id}`} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800">View</Link>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(wo.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      {assignId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setAssignId(null)}></div>
          <div className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-white">Assign Worker</h3>
            <p className="text-xs text-slate-400">Eligible AVAILABLE workers with matching skill</p>
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {eligible.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">No eligible workers available. Work order remains PENDING.</p>
              ) : (
                eligible.map((w) => (
                  <button key={w.id} disabled={assigning} onClick={() => doAssign(w.id)} className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 hover:border-slate-700 hover:bg-slate-800 disabled:opacity-50">
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{w.name}</p>
                      <p className="text-xs text-slate-400">{w.location} · {w.skills}</p>
                    </div>
                    <span className="rounded-full border border-emerald-900 bg-emerald-950 px-2 py-0.5 text-xs text-emerald-300">{w.status}</span>
                  </button>
                ))
              )}
            </div>
            {msg && <p className="mt-3 text-xs text-slate-300">{msg}</p>}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setAssignId(null)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
