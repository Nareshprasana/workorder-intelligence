"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function WorkerPage() {
  const params = useParams();
  const workerId = params?.id;

  const [worker, setWorker] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

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
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm text-slate-400">Loading worker...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            ← Back to Dashboard
          </Link>
          <div className="mt-6 rounded-lg border border-red-900/50 bg-red-950/30 p-6 text-center">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!worker) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm text-slate-400">Worker not found.</p>
        </div>
      </main>
    );
  }

  const workOrders = worker.workOrders || [];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← Back to Dashboard
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{worker.name}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {worker.location} · {worker.skills}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                worker.status === "AVAILABLE"
                  ? "border-emerald-900 bg-emerald-950 text-emerald-300"
                  : worker.status === "BUSY"
                    ? "border-amber-900 bg-amber-950 text-amber-300"
                    : "border-slate-700 bg-slate-800 text-slate-300"
              }`}
            >
              {worker.status}
            </span>
            <select
              value={worker.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusUpdating}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-slate-600 disabled:opacity-50"
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="BUSY">BUSY</option>
              <option value="OFFLINE">OFFLINE</option>
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Changing to OFFLINE or BUSY prevents new work-order assignment (deterministic matching requires AVAILABLE).
        </p>

        {actionMessage && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300">
            {actionMessage}
          </div>
        )}

        {/* Notifications */}
        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <p className="text-sm text-slate-400">
            {notifications.filter((n) => n.status === "UNREAD").length} unread · {notifications.length} total
          </p>

          {notifications.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-8 text-center">
              <p className="text-sm text-slate-400">No notifications yet.</p>
              <p className="mt-1 text-xs text-slate-500">Work orders assigned to you will appear here.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            n.status === "UNREAD"
                              ? "bg-blue-950 text-blue-300 border border-blue-900"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {n.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{n.message}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        {n.workOrder?.priority && <span>Priority: {n.workOrder.priority}</span>}
                        {n.workOrder?.incident?.issue && <span>Issue: {n.workOrder.incident.issue}</span>}
                        {n.workOrder?.incident?.location && <span>{n.workOrder.incident.location}</span>}
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    {n.status === "UNREAD" && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Assigned Work Orders */}
        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Assigned Work Orders</h2>
          <p className="text-sm text-slate-400">{workOrders.length} work orders</p>

          {workOrders.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-8 text-center">
              <p className="text-sm text-slate-400">No work orders assigned.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {workOrders.map((wo) => (
                <div key={wo.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium">{wo.incident?.issue || wo.description?.slice(0, 60)}</p>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-300">
                      {wo.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{wo.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {wo.incident?.location} · Priority: {wo.priority} · SLA: {wo.slaHours}h
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Action: {wo.action}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {wo.status === "ASSIGNED" && (
                      <>
                        <button
                          onClick={() => handleWorkOrderAction(wo.id, "accept")}
                          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-200"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleWorkOrderAction(wo.id, "reject")}
                          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {wo.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handleWorkOrderAction(wo.id, "complete")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Complete
                      </button>
                    )}
                    {wo.status === "COMPLETED" && (
                      <span className="text-xs text-emerald-400">Completed at {wo.completedAt ? new Date(wo.completedAt).toLocaleString() : ""}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
