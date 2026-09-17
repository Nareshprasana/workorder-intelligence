"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Reveal from "../../../../../components/dashboard/Reveal";

function Badge({ children, tone = "slate" }) {
  const map = {
    slate: "border-slate-700 bg-slate-800 text-slate-300",
    emerald: "border-emerald-900 bg-emerald-950 text-emerald-300",
    amber: "border-amber-900 bg-amber-950 text-amber-300",
    blue: "border-blue-900 bg-blue-950 text-blue-300",
    sky: "border-sky-900 bg-sky-950 text-sky-300",
    red: "border-red-900 bg-red-950 text-red-300",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>;
}

export default function JobDetailPage() {
  const params = useParams();
  const workerId = params?.id;
  const workOrderId = params?.workOrderId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState("");
  const [acting, setActing] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/workers/${workerId}/jobs/${workOrderId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load job");
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (workerId && workOrderId) load();
  }, [workerId, workOrderId]);

  async function doAction(action) {
    setActionMsg("");
    setActing(action);
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Failed to ${action}`);
      setActionMsg(`Success: ${action}`);
      await load();
    } catch (e) {
      setActionMsg(e.message);
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-xl bg-slate-900"></div>
        <div className="h-64 animate-pulse rounded-xl bg-slate-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link href={`/workers/${workerId}`} className="text-sm text-slate-400 hover:text-white">← Back to Worker Dashboard</Link>
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
          <p className="text-sm font-medium text-red-300">{error}</p>
          <p className="mt-1 text-xs text-red-400">You are not authorized to view this job or it does not exist.</p>
        </div>
      </div>
    );
  }

  const wo = data.workOrder;
  const worker = data.worker;
  const inc = wo.incident;

  return (
    <div className="space-y-6">
      <Reveal>
        <Link href={`/workers/${workerId}`} className="text-sm text-slate-400 hover:text-white">← Back to Worker Dashboard</Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-slate-500">JOB DETAIL</p>
            <h1 className="mt-1 text-xl font-bold text-white">{inc?.issue || wo.description.slice(0, 60)}</h1>
            <p className="text-sm text-slate-400">Work Order {wo.id} · Incident {wo.incidentId}</p>
          </div>
          <Badge tone={wo.status === "COMPLETED" ? "emerald" : wo.status === "IN_PROGRESS" ? "blue" : wo.status === "ASSIGNED" ? "sky" : "amber"}>{wo.status}</Badge>
        </div>
      </Reveal>

      {actionMsg && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">{actionMsg}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Reveal>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-sm font-semibold text-white">Work Order Information</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Work Order ID</p>
                  <p className="font-mono text-xs text-white break-all">{wo.id}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Incident ID</p>
                  <p className="font-mono text-xs text-white break-all">{wo.incidentId}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Issue</p>
                  <p className="text-white">{inc?.issue || "—"}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="text-white">{inc?.category || "—"}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 sm:col-span-2">
                  <p className="text-xs text-slate-500">Description</p>
                  <p className="text-white">{wo.description}</p>
                </div>
                <div><p className="text-xs text-slate-500">Severity / Priority</p><p className="mt-1"><Badge tone={wo.priority === "CRITICAL" || wo.priority === "HIGH" ? "red" : wo.priority === "MEDIUM" ? "amber" : "slate"}>{wo.priority}</Badge> {inc?.severity && <span className="ml-2 text-xs text-slate-500">Incident severity: {inc.severity}</span>}</p></div>
                <div><p className="text-xs text-slate-500">SLA</p><p className="text-white">{wo.slaHours} hours</p></div>
                <div><p className="text-xs text-slate-500">Resident</p><p className="text-white">{inc?.resident ? `${inc.resident.name} · ${inc.resident.building}, ${inc.resident.apartment}` : inc?.reporterName || "—"}</p><p className="text-xs text-slate-500">{inc?.resident?.phone || inc?.reporterPhone || ""} {inc?.resident?.email ? `· ${inc.resident.email}` : ""}</p></div>
                <div><p className="text-xs text-slate-500">Location</p><p className="text-white">{inc?.location || wo.description}</p></div>
                <div><p className="text-xs text-slate-500">Asset</p><p className="text-white">{inc?.asset ? `${inc.asset.name} · ${inc.asset.assetCode}` : "—"}</p><p className="text-xs text-slate-500">{inc?.asset?.location || ""}</p></div>
                <div className="sm:col-span-2 rounded-lg border border-sky-900/50 bg-sky-950/20 p-3">
                  <p className="text-xs font-semibold text-sky-300">AI Recommended Action</p>
                  <p className="mt-1 text-sm text-white">{wo.action}</p>
                </div>
                <div><p className="text-xs text-slate-500">Current Work Order Status</p><p className="mt-1"><Badge tone={wo.status === "COMPLETED" ? "emerald" : wo.status === "IN_PROGRESS" ? "blue" : "sky"}>{wo.status}</Badge></p></div>
                <div><p className="text-xs text-slate-500">Assigned time</p><p className="text-white text-xs">{wo.assignedAt ? new Date(wo.assignedAt).toLocaleString() : "—"}</p></div>
                <div><p className="text-xs text-slate-500">Started</p><p className="text-white text-xs">{wo.startedAt ? new Date(wo.startedAt).toLocaleString() : "—"}</p></div>
                <div><p className="text-xs text-slate-500">Completed</p><p className="text-white text-xs">{wo.completedAt ? new Date(wo.completedAt).toLocaleString() : "—"}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-slate-500">Notification status</p><p className="text-white text-xs">{wo.notifications?.[0]?.status || "—"} {wo.notifications?.[0] ? `· ${wo.notifications[0].title}` : ""}</p></div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-sm font-semibold text-white">Assigned Worker</h2>
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white font-bold">{worker.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium text-white">{worker.name}</p>
                  <p className="text-xs text-slate-400">{worker.location} · {worker.skills} · {worker.status}</p>
                </div>
                <div className="ml-auto"><Badge tone={worker.status === "AVAILABLE" ? "emerald" : worker.status === "BUSY" ? "amber" : "slate"}>{worker.status}</Badge></div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="space-y-6">
          <Reveal>
            <div className="rounded-xl border-2 border-slate-800 bg-slate-900 p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-white">Actions</h3>
              <p className="text-xs text-slate-500">State: {wo.status} → Next step</p>
              <div className="mt-4 flex flex-col gap-3">
                {wo.status === "ASSIGNED" && (
                  <>
                    <button disabled={!!acting} onClick={() => doAction("accept")} className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_0_rgb(5_60_30)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 hover:bg-emerald-700">
                      {acting === "accept" ? "Accepting..." : "ACCEPT JOB"}
                    </button>
                    <button disabled={!!acting} onClick={() => doAction("reject")} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50">
                      {acting === "reject" ? "Rejecting..." : "Reject & Reassign"}
                    </button>
                    <p className="text-xs text-slate-500">Accept moves to IN_PROGRESS · Reject finds next eligible worker or goes PENDING</p>
                  </>
                )}
                {wo.status === "IN_PROGRESS" && (
                  <>
                    <button disabled={!!acting} onClick={() => doAction("complete")} className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_0_rgb(5_60_30)] hover:-translate-y-0.5 transition-all disabled:opacity-50 hover:bg-emerald-700">
                      {acting === "complete" ? "Completing..." : "COMPLETE JOB"}
                    </button>
                    <p className="text-xs text-slate-500">Completing will mark Work Order & Incident as COMPLETED and set you AVAILABLE</p>
                  </>
                )}
                {wo.status === "COMPLETED" && (
                  <div className="rounded-lg border border-emerald-900 bg-emerald-950/40 p-4 text-center">
                    <p className="text-sm font-semibold text-emerald-300">Job Completed ✓</p>
                    <p className="text-xs text-emerald-400">Completed at {wo.completedAt ? new Date(wo.completedAt).toLocaleString() : ""}</p>
                  </div>
                )}
                {wo.status === "PENDING" && (
                  <div className="rounded-lg border border-amber-900 bg-amber-950/30 p-4 text-center">
                    <p className="text-sm font-medium text-amber-300">Awaiting worker assignment</p>
                    <p className="text-xs text-amber-400">This should not happen for your own job. Contact operations.</p>
                  </div>
                )}
              </div>
              <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs font-semibold text-slate-400">Flow</p>
                <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                  <span className={`rounded-full px-2 py-0.5 border ${wo.status === "ASSIGNED" ? "border-sky-900 bg-sky-950 text-sky-300" : "border-slate-700 bg-slate-800 text-slate-400"}`}>ASSIGNED</span>
                  <span className="text-slate-600">→</span>
                  <span className={`rounded-full px-2 py-0.5 border ${wo.status === "IN_PROGRESS" ? "border-blue-900 bg-blue-950 text-blue-300" : "border-slate-700 bg-slate-800 text-slate-400"}`}>IN_PROGRESS</span>
                  <span className="text-slate-600">→</span>
                  <span className={`rounded-full px-2 py-0.5 border ${wo.status === "COMPLETED" ? "border-emerald-900 bg-emerald-950 text-emerald-300" : "border-slate-700 bg-slate-800 text-slate-400"}`}>COMPLETED</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h4 className="text-xs font-semibold text-slate-400">Need help?</h4>
              <p className="mt-1 text-xs text-slate-500">Follow SOP for {inc?.category || "general"} maintenance. Ensure safety checks before closing.</p>
              <Link href={`/workers/${workerId}`} className="mt-3 block text-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800">
                Back to Dashboard
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
