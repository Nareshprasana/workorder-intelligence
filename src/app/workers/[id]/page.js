"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Reveal from "../../../components/dashboard/Reveal";
import MetricCard from "../../../components/dashboard/MetricCard";
import { ThreeDButton } from "../../../components/dashboard/ThreeDButton";

function StatusBadge({ status }) {
  const map = {
    AVAILABLE: "border-emerald-900 bg-emerald-950 text-emerald-300",
    BUSY: "border-amber-900 bg-amber-950 text-amber-300",
    OFFLINE: "border-slate-700 bg-slate-800 text-slate-300",
  };
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status] || map.OFFLINE}`}>{status}</span>;
}

function WoStatusBadge({ status }) {
  const map = {
    PENDING: "border-amber-900 bg-amber-950 text-amber-300",
    ASSIGNED: "border-sky-900 bg-sky-950 text-sky-300",
    IN_PROGRESS: "border-blue-900 bg-blue-950 text-blue-300",
    COMPLETED: "border-emerald-900 bg-emerald-950 text-emerald-300",
    CANCELLED: "border-slate-700 bg-slate-800 text-slate-400",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${map[status] || "border-slate-700 bg-slate-800 text-slate-300"}`}>{status}</span>;
}

function PriorityBadge({ priority }) {
  const map = {
    CRITICAL: "border-red-900 bg-red-950 text-red-300",
    HIGH: "border-orange-900 bg-orange-950 text-orange-300",
    MEDIUM: "border-yellow-900 bg-yellow-950 text-yellow-300",
    LOW: "border-slate-700 bg-slate-800 text-slate-300",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${map[priority] || map.LOW}`}>{priority}</span>;
}

export default function WorkerPage() {
  const params = useParams();
  const workerId = params?.id;

  const [worker, setWorker] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [notifFilter, setNotifFilter] = useState("ALL");

  async function handleStatusChange(newStatus) {
    if (newStatus === worker?.status) return;
    setStatusUpdating(true);
    setActionMessage("");
    try {
      const res = await fetch(`/api/workers/${workerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setWorker(data.worker);
      setActionMessage(`Availability updated to ${data.worker.status}`);
    } catch (err) {
      setActionMessage(err.message);
    } finally {
      setStatusUpdating(false);
    }
  }

  async function loadData() {
    if (!workerId) return;
    try {
      setLoading(true);
      setError(null);
      const [workerRes, notifRes] = await Promise.all([
        fetch(`/api/workers/${workerId}`),
        fetch(`/api/workers/${workerId}/notifications`),
      ]);

      if (!workerRes.ok) {
        const err = await workerRes.json();
        throw new Error(err.error || "Failed to load worker");
      }
      if (!notifRes.ok) {
        const err = await notifRes.json();
        throw new Error(err.error || "Failed to load notifications");
      }

      const workerData = await workerRes.json();
      const notifData = await notifRes.json();

      setWorker(workerData.worker);
      setNotifications(notifData.notifications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [workerId]);

  async function markAsRead(notificationId) {
    try {
      const res = await fetch(`/api/workers/${workerId}/notifications/${notificationId}`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark as read");
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, status: "READ" } : n))
      );
    } catch (err) {
      setActionMessage(err.message);
    }
  }

  async function handleWorkOrderAction(workOrderId, action) {
    setActionMessage("");
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action}`);
      setActionMessage(`Work order ${action} successful.`);
      await loadData();
    } catch (err) {
      setActionMessage(err.message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-xl bg-slate-900"></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-900"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/workers" className="text-sm text-slate-400 hover:text-white">
          ← Back to Workers
        </Link>
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return <div className="py-10 text-center text-sm text-slate-400">Worker not found.</div>;
  }

  const workOrders = worker.workOrders || [];
  const unreadCount = notifications.filter((n) => n.status === "UNREAD").length;
  const newJobs = workOrders.filter((w) => w.status === "ASSIGNED").length;
  const assignedJobs = newJobs;
  const inProgress = workOrders.filter((w) => w.status === "IN_PROGRESS").length;
  const completed = workOrders.filter((w) => w.status === "COMPLETED").length;

  const grouped = {
    newAssigned: workOrders.filter((w) => ["ASSIGNED", "PENDING"].includes(w.status)),
    inProgress: workOrders.filter((w) => w.status === "IN_PROGRESS"),
    completed: workOrders.filter((w) => w.status === "COMPLETED"),
  };

  const filteredNotifications = notifFilter === "ALL" ? notifications : notifications.filter((n) => n.status === notifFilter);

  // Find current job = first ASSIGNED or IN_PROGRESS
  const currentJob = workOrders.find((w) => w.status === "ASSIGNED") || workOrders.find((w) => w.status === "IN_PROGRESS") || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-slate-500">WORKER OPERATIONS</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Worker Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Technician workspace · Job delivery and field execution</p>
          </div>
          <Link href="/workers" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800">
            ← All Workers
          </Link>
        </div>
      </Reveal>

      {/* Worker Header Card */}
      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-lg font-bold text-white">
                {worker.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{worker.name}</h2>
                <p className="text-sm text-slate-400">
                  {worker.location} · {worker.skills}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={worker.status} />
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs text-slate-400">{worker.skills}</span>
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs text-slate-400">{worker.location}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Availability</span>
                <select
                  value={worker.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={statusUpdating}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-slate-600 disabled:opacity-50"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="BUSY">BUSY</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>
              <p className="text-xs text-slate-500">Changing to OFFLINE or BUSY prevents new assignment</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">Notifications</span>
                <span className={`rounded-full px-2 py-0.5 font-bold ${unreadCount > 0 ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-400"}`}>{unreadCount}</span>
                <span className="text-slate-500">{unreadCount} unread · {notifications.length} total</span>
              </div>
            </div>
          </div>
          {actionMessage && (
            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300">
              {actionMessage}
            </div>
          )}
        </div>
      </Reveal>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal delay={20}>
          <MetricCard label="New Jobs" value={newJobs} sublabel={`${unreadCount} unread notifications`} accent="blue" icon={<span className="text-sm">✦</span>} />
        </Reveal>
        <Reveal delay={40}>
          <MetricCard label="Assigned Jobs" value={assignedJobs} sublabel="Awaiting accept" accent="sky" icon={<span className="text-sm">⧉</span>} />
        </Reveal>
        <Reveal delay={60}>
          <MetricCard label="In Progress" value={inProgress} sublabel="Currently working" accent="amber" icon={<span className="text-sm">◈</span>} />
        </Reveal>
        <Reveal delay={80}>
          <MetricCard label="Completed" value={completed} sublabel="Finished jobs" accent="emerald" icon={<span className="text-sm">✓</span>} />
        </Reveal>
      </div>

      {/* Current Job prominent */}
      {currentJob && (
        <Reveal>
          <div className="rounded-xl border-2 border-sky-900/50 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 rounded-bl-xl bg-sky-600 px-3 py-1 text-xs font-bold text-white">CURRENT JOB</div>
            <div className="mt-2">
              <p className="text-sm font-semibold text-white">{currentJob.incident?.issue || currentJob.description.slice(0, 60)}</p>
              <p className="mt-1 text-xs text-slate-400">
                Resident: {currentJob.incident?.resident?.name || "—"} · {currentJob.incident?.resident ? `${currentJob.incident.resident.building}, ${currentJob.incident.resident.apartment}` : currentJob.incident?.location} {currentJob.incident?.asset?.assetCode ? `· ${currentJob.incident.asset.assetCode}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <PriorityBadge priority={currentJob.priority} />
                <WoStatusBadge status={currentJob.status} />
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300">SLA {currentJob.slaHours}h</span>
                {currentJob.assignedAt && <span className="text-xs text-slate-500">Assigned {new Date(currentJob.assignedAt).toLocaleString()}</span>}
              </div>
              <p className="mt-3 text-xs text-slate-400 line-clamp-2">{currentJob.description}</p>
              <p className="mt-1 text-xs font-medium text-sky-300">Recommended: {currentJob.action}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/workers/${workerId}/jobs/${currentJob.id}`} className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_4px_0_0_rgb(15_23_42)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
                View Job Details →
              </Link>
              {currentJob.status === "ASSIGNED" && (
                <>
                  <button onClick={() => handleWorkOrderAction(currentJob.id, "accept")} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_0_0_rgb(5_80_40)] hover:-translate-y-0.5 active:translate-y-0 transition-all hover:bg-emerald-700">
                    ACCEPT JOB
                  </button>
                  <button onClick={() => handleWorkOrderAction(currentJob.id, "reject")} className="rounded-lg border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800">
                    Reject
                  </button>
                </>
              )}
              {currentJob.status === "IN_PROGRESS" && (
                <button onClick={() => handleWorkOrderAction(currentJob.id, "complete")} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_0_0_rgb(5_80_40)] hover:-translate-y-0.5 transition-all hover:bg-emerald-700">
                  COMPLETE JOB
                </button>
              )}
              {currentJob.status === "COMPLETED" && <span className="rounded-lg border border-emerald-900 bg-emerald-950 px-4 py-2 text-sm font-medium text-emerald-300">Job Completed ✓</span>}
            </div>
          </div>
        </Reveal>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Notification Panel - takes 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <Reveal>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    Notifications
                    {unreadCount > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white animate-pulse">{unreadCount} NEW</span>}
                  </h2>
                  <p className="text-xs text-slate-500">{unreadCount} unread · {notifications.length} total</p>
                </div>
                <div className="flex gap-1">
                  {["ALL", "UNREAD", "READ"].map((f) => (
                    <button key={f} onClick={() => setNotifFilter(f)} className={`rounded-full border px-2 py-1 text-xs ${notifFilter === f ? "border-white bg-white text-slate-900" : "border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-800"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredNotifications.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-sm text-slate-400">No notifications yet.</p>
                  <p className="mt-1 text-xs text-slate-500">Work orders assigned to you will appear here.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {filteredNotifications.map((n) => {
                    const isUnread = n.status === "UNREAD";
                    return (
                      <div
                        key={n.id}
                        className={`rounded-lg border p-4 transition-all hover:-translate-y-0.5 ${isUnread ? "border-sky-900 bg-sky-950/30 shadow-md ring-1 ring-sky-900/30" : "border-slate-800 bg-slate-950 opacity-80"}`}
                      >
                        {isUnread && (
                          <div className="mb-2 flex items-center gap-2">
                            <span className="rounded-full bg-sky-600 px-2 py-0.5 text-xs font-bold text-white">NEW</span>
                            <span className="text-xs font-semibold text-sky-300">NEW WORK ORDER</span>
                            <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${isUnread ? "font-semibold text-white" : "font-medium text-slate-300"}`}>{n.title}</p>
                            <p className={`mt-1 text-sm ${isUnread ? "text-slate-200 font-medium" : "text-slate-400"}`}>{n.message}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              {n.workOrder?.priority && <PriorityBadge priority={n.workOrder.priority} />}
                              {n.workOrder?.incident?.issue && <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-400">{n.workOrder.incident.issue}</span>}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                              {n.workOrder?.incident?.location && <span>{n.workOrder.incident.location}</span>}
                              {n.workOrder?.incident?.property?.name && <span>{n.workOrder.incident.property.name}</span>}
                              <span>{new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                            {n.workOrderId && (
                              <Link href={`/workers/${workerId}/jobs/${n.workOrderId}`} className="mt-3 inline-flex rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800">
                                View Job
                              </Link>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isUnread ? "bg-blue-950 text-blue-300 border border-blue-900 shadow-sm" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                              {n.status}
                            </span>
                            {isUnread && (
                              <button onClick={() => markAsRead(n.id)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap">
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {/* My Jobs section - takes 3 cols */}
        <div className="lg:col-span-3 space-y-6">
          <Reveal>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-sm font-semibold text-white">My Jobs</h2>
              <p className="text-xs text-slate-500">Only your assigned work orders · workerId filtered</p>

              {/* NEW / ASSIGNED */}
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold tracking-widest text-sky-400">NEW / ASSIGNED</h3>
                  <span className="rounded-full bg-sky-950 border border-sky-900 px-2 py-0.5 text-xs text-sky-300">{grouped.newAssigned.length}</span>
                </div>
                {grouped.newAssigned.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-slate-700 bg-slate-950 p-4 text-center text-xs text-slate-500">No new jobs.</p>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {grouped.newAssigned.map((wo) => (
                      <Link key={wo.id} href={`/workers/${workerId}/jobs/${wo.id}`} className="group rounded-lg border border-sky-900/50 bg-slate-950 p-4 hover:border-sky-800 hover:bg-slate-900 transition-all hover:-translate-y-0.5 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-white line-clamp-1 group-hover:text-sky-200">{wo.incident?.issue || wo.description.slice(0, 40)}</p>
                          <WoStatusBadge status={wo.status} />
                        </div>
                        <p className="mt-1 text-xs text-slate-400 truncate">Resident: {wo.incident?.resident?.name || "—"} · {wo.incident?.resident ? `${wo.incident.resident.building}, ${wo.incident.resident.apartment}` : wo.incident?.location}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <PriorityBadge priority={wo.priority} />
                          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-400">SLA {wo.slaHours}h</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 line-clamp-1">WO: {wo.id.slice(0, 8)} · Complaint: {wo.incidentId.slice(0, 8)}</p>
                        <div className="mt-3 flex gap-2">
                          <span className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-900 group-hover:bg-slate-100">View Job</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* IN PROGRESS */}
              <div className="mt-8">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold tracking-widest text-amber-400">IN PROGRESS</h3>
                  <span className="rounded-full bg-amber-950 border border-amber-900 px-2 py-0.5 text-xs text-amber-300">{grouped.inProgress.length}</span>
                </div>
                {grouped.inProgress.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-slate-700 bg-slate-950 p-4 text-center text-xs text-slate-500">No jobs in progress.</p>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {grouped.inProgress.map((wo) => (
                      <Link key={wo.id} href={`/workers/${workerId}/jobs/${wo.id}`} className="group rounded-lg border border-blue-900/50 bg-slate-950 p-4 hover:border-blue-800 transition-all hover:-translate-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-white line-clamp-1">{wo.incident?.issue || wo.description.slice(0, 40)}</p>
                          <WoStatusBadge status={wo.status} />
                        </div>
                        <p className="mt-1 text-xs text-slate-400 truncate">Resident: {wo.incident?.resident?.name || "—"} · {wo.incident?.location}</p>
                        <div className="mt-2 flex gap-1.5">
                          <PriorityBadge priority={wo.priority} />
                          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-400">SLA {wo.slaHours}h</span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full w-2/3 rounded-full bg-blue-600"></div>
                        </div>
                        <p className="mt-2 text-xs text-blue-400">Working… Started {wo.startedAt ? new Date(wo.startedAt).toLocaleString() : ""}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* COMPLETED */}
              <div className="mt-8">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold tracking-widest text-emerald-400">COMPLETED</h3>
                  <span className="rounded-full bg-emerald-950 border border-emerald-900 px-2 py-0.5 text-xs text-emerald-300">{grouped.completed.length}</span>
                </div>
                {grouped.completed.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-slate-700 bg-slate-950 p-4 text-center text-xs text-slate-500">No completed jobs yet.</p>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {grouped.completed.map((wo) => (
                      <Link key={wo.id} href={`/workers/${workerId}/jobs/${wo.id}`} className="group rounded-lg border border-emerald-900/30 bg-slate-950 p-4 hover:border-emerald-800/50 transition-all hover:-translate-y-0.5 opacity-90">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-white line-clamp-1">{wo.incident?.issue || wo.description.slice(0, 40)}</p>
                          <WoStatusBadge status={wo.status} />
                        </div>
                        <p className="mt-1 text-xs text-slate-400 truncate">Resident: {wo.incident?.resident?.name || "—"} · {wo.incident?.location}</p>
                        <div className="mt-2 flex gap-1.5">
                          <PriorityBadge priority={wo.priority} />
                          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-400">SLA {wo.slaHours}h</span>
                        </div>
                        <p className="mt-2 text-xs text-emerald-400">Completed {wo.completedAt ? new Date(wo.completedAt).toLocaleString() : ""} ✓</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
