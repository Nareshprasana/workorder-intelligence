"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [creatingId, setCreatingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState("");

  const [workers, setWorkers] = useState([]);
  const [workerCounts, setWorkerCounts] = useState({ available: 0, busy: 0, offline: 0, total: 0 });
  const [workersLoading, setWorkersLoading] = useState(true);
  const [workersError, setWorkersError] = useState(null);

  const limit = 5;

  async function loadDashboard(targetPage) {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/dashboard?page=${targetPage}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to load dashboard");
      }
      const data = await response.json();
      setDashboard(data);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkers() {
    try {
      setWorkersLoading(true);
      setWorkersError(null);
      const res = await fetch("/api/workers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load workers");
      setWorkers(data.workers || []);
      if (data.counts) setWorkerCounts(data.counts);
    } catch (err) {
      setWorkersError(err.message);
    } finally {
      setWorkersLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard(page);
  }, [page]);

  useEffect(() => {
    loadWorkers();
  }, []);

  const stats = dashboard || {
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
  };

  const recentIncidents = dashboard?.recentIncidents || [];

  const analyzedCount = recentIncidents.filter((i) => i.status !== "NEW").length;
  const needsInfoCount = recentIncidents.filter((i) => i.status === "NEEDS_INFORMATION").length;
  const readyCount = recentIncidents.filter((i) => i.status === "READY").length;

  async function handleCreateWorkOrder(incidentId) {
    setCreatingId(incidentId);
    setActionFeedback("");
    try {
      const res = await fetch(`/api/incidents/${incidentId}/work-order`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create work order");
      if (data.worker) {
        setActionFeedback(`Work order assigned to ${data.worker.name} (SLA ${data.slaHours}h)`);
      } else {
        setActionFeedback("Work order created — pending worker assignment");
      }
      await loadDashboard(page);
      await loadWorkers();
    } catch (err) {
      setActionFeedback(err.message);
    } finally {
      setCreatingId(null);
    }
  }

  function goToPage(newPage) {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPage(newPage);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              WorkOrder Intelligence
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              AI-powered maintenance triage and worker dispatch
            </p>
          </div>

          <Link
            href="/complaints/new"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
          >
            + New Complaint
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total" value={stats.total} />
          <StatCard title="Pending" value={stats.pending} />
          <StatCard title="Assigned" value={stats.assigned} />
          <StatCard title="In Progress" value={stats.inProgress} />
          <StatCard title="Completed" value={stats.completed} />
        </div>

        {/* Worker Availability */}
        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Worker Availability</h2>
              <p className="text-sm text-slate-400">
                Real worker database · Deterministic assignment requires AVAILABLE
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/workers"
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                View all
              </Link>
              <Link
                href="/workers/new"
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
              >
                + Add Worker
              </Link>
            </div>
          </div>

          {/* Summary cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-400">Total Workers</p>
              <p className="mt-1 text-2xl font-bold">{workersLoading ? "—" : workerCounts.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
              <p className="text-xs text-emerald-300/80">Available</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">{workersLoading ? "—" : workerCounts.available}</p>
            </div>
            <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
              <p className="text-xs text-amber-300/80">Busy</p>
              <p className="mt-1 text-2xl font-bold text-amber-400">{workersLoading ? "—" : workerCounts.busy}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <p className="text-xs text-slate-400">Offline</p>
              <p className="mt-1 text-2xl font-bold text-slate-300">{workersLoading ? "—" : workerCounts.offline}</p>
            </div>
          </div>

          {/* Worker list */}
          <div className="mt-6">
            {workersLoading && (
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-center">
                <p className="text-sm text-slate-400">Loading workers...</p>
              </div>
            )}
            {!workersLoading && workersError && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-center">
                <p className="text-sm text-red-300">{workersError}</p>
              </div>
            )}
            {!workersLoading && !workersError && workers.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
                <p className="text-sm text-slate-400">No workers yet.</p>
                <Link href="/workers/new" className="mt-3 inline-block text-sm text-slate-300 hover:text-white">
                  Add first worker →
                </Link>
              </div>
            )}
            {!workersLoading && !workersError && workers.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-800 bg-slate-900/50 text-xs text-slate-400">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Name</th>
                        <th className="px-4 py-2.5 font-medium">Skills</th>
                        <th className="px-4 py-2.5 font-medium">Location</th>
                        <th className="px-4 py-2.5 font-medium">Availability</th>
                        <th className="px-4 py-2.5 font-medium text-center">Assigned</th>
                        <th className="px-4 py-2.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {workers.slice(0, 8).map((w) => (
                        <tr key={w.id} className="hover:bg-slate-900/50">
                          <td className="px-4 py-2.5 font-medium text-white">{w.name}</td>
                          <td className="px-4 py-2.5 text-slate-400">{w.skills}</td>
                          <td className="px-4 py-2.5 text-slate-400">{w.location}</td>
                          <td className="px-4 py-2.5">
                            <WorkerStatusBadge status={w.status} />
                          </td>
                          <td className="px-4 py-2.5 text-center text-slate-300">{w.workOrderCount}</td>
                          <td className="px-4 py-2.5 text-right">
                            <Link
                              href={`/workers/${w.id}`}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {workers.length > 8 && (
                  <div className="border-t border-slate-800 bg-slate-900/30 px-4 py-2.5 text-center">
                    <Link href="/workers" className="text-xs text-slate-400 hover:text-white">
                      View all {workers.length} workers →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Main content */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Recent Incidents */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recent Incidents</h2>

                <p className="text-sm text-slate-400">
                  Latest maintenance activity
                  {!loading && !error && pagination.total > 0 && (
                    <span className="text-slate-500"> · Page {pagination.page} of {pagination.totalPages}</span>
                  )}
                </p>
              </div>

              <Link
                href="/complaints/new"
                className="text-sm text-slate-300 hover:text-white"
              >
                New complaint
              </Link>
            </div>

            {actionFeedback && (
              <div className="mb-4 rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-300">
                {actionFeedback}
              </div>
            )}

            {loading && (
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-10 text-center">
                <p className="text-sm text-slate-400">Loading incidents...</p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-6 text-center">
                <p className="text-sm text-red-300">{error}</p>
                <p className="mt-1 text-xs text-red-400/70">
                  Please refresh the page to retry.
                </p>
              </div>
            )}

            {!loading && !error && recentIncidents.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center">
                <p className="text-slate-400">No maintenance incidents yet.</p>
                <p className="mt-1 text-xs text-slate-500">
                  Create a complaint to start the AI workflow.
                </p>
                <Link
                  href="/complaints/new"
                  className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
                >
                  Create first complaint
                </Link>
              </div>
            )}

            {!loading && !error && recentIncidents.length > 0 && (
              <>
                <div className="space-y-3">
                  {recentIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="max-w-[60%] text-sm font-medium leading-5">
                          {incident.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <StatusBadge status={incident.status} />
                          {incident.severity && (
                            <SeverityBadge severity={incident.severity} />
                          )}
                          {incident.category && (
                            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-300">
                              {incident.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>{incident.location}</span>
                        {incident.asset?.assetCode && (
                          <span className="text-slate-400">
                            Asset: {incident.asset.assetCode}
                          </span>
                        )}
                        {incident.asset?.name && (
                          <span>{incident.asset.name}</span>
                        )}
                        <span>
                          {new Date(incident.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {incident.issue && (
                        <p className="mt-2 text-xs text-slate-400">
                          <span className="text-slate-500">Issue:</span> {incident.issue}
                        </p>
                      )}

                      {incident.recommendedAction && (
                        <p className="mt-1 text-xs text-slate-400">
                          <span className="text-slate-500">Recommended:</span>{" "}
                          {incident.recommendedAction}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        {incident.confidence != null && (
                          <span className="text-slate-400">
                            Confidence: {Math.round(incident.confidence * 100)}%
                          </span>
                        )}
                        {incident.asset?.category && (
                          <span className="text-slate-500">
                            {incident.asset.category} · {incident.asset.location}
                          </span>
                        )}
                      </div>

                      {/* Work Order info compact */}
                      {incident.workOrder && (
                        <div className="mt-3 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-medium text-slate-300">Work Order</span>
                            <span className={`rounded-full border px-2 py-0.5 text-xs ${workOrderStatusStyle(incident.workOrder.status)}`}>
                              {incident.workOrder.status}
                            </span>
                            <span className="text-slate-400">
                              Priority: {incident.workOrder.priority} · SLA: {incident.workOrder.slaHours}h
                            </span>
                            {incident.workOrder.worker && (
                              <span className="text-slate-300">
                                Assigned to{" "}
                                <Link href={`/workers/${incident.workOrder.worker.id}`} className="underline hover:text-white">
                                  {incident.workOrder.worker.name}
                                </Link>
                              </span>
                            )}
                            {!incident.workOrder.worker && (
                              <span className="text-amber-300">Pending worker assignment</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Create Work Order action for READY */}
                      {incident.status === "READY" && !incident.workOrder && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleCreateWorkOrder(incident.id)}
                            disabled={creatingId === incident.id}
                            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
                          >
                            {creatingId === incident.id ? "Creating..." : "Create Work Order"}
                          </button>
                        </div>
                      )}

                      {incident.status === "READY" && incident.workOrder && incident.workOrder.worker && (
                        <p className="mt-2 text-xs text-emerald-400">
                          Assigned to {incident.workOrder.worker.name}
                        </p>
                      )}
                      {incident.status === "READY" && incident.workOrder && !incident.workOrder.worker && (
                        <p className="mt-2 text-xs text-amber-300">Pending worker assignment</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1 || loading}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        disabled={loading}
                        className={`h-7 w-7 rounded-md text-xs font-medium ${
                          p === pagination.page
                            ? "bg-white text-slate-900"
                            : "border border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800"
                        } disabled:opacity-50`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= pagination.totalPages || loading}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </section>

          {/* AI Activity */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">AI Activity</h2>

            <p className="mt-1 text-sm text-slate-400">
              Recent intelligence decisions
            </p>

            <div className="mt-6 space-y-4">
              <Activity
                title="AI Intake"
                description={
                  loading
                    ? "Loading..."
                    : error
                      ? "Unable to load activity"
                      : recentIncidents.length === 0
                        ? "Waiting for first complaint"
                        : analyzedCount === 0
                          ? "No incidents analyzed yet"
                          : `${analyzedCount} of ${recentIncidents.length} incidents analyzed`
                }
              />

              <Activity
                title="Clarification"
                description={
                  loading
                    ? "Loading..."
                    : error
                      ? "Unable to load activity"
                      : needsInfoCount === 0
                        ? recentIncidents.length === 0
                          ? "No clarifications needed yet"
                          : "No incidents needing information"
                        : `${needsInfoCount} incident${needsInfoCount > 1 ? "s" : ""} need clarification`
                }
              />

              <Activity
                title="Ready"
                description={
                  loading
                    ? "Loading..."
                    : error
                      ? "Unable to load activity"
                      : readyCount === 0
                        ? recentIncidents.length === 0
                          ? "No incidents ready yet"
                          : "No incidents ready for work order"
                        : `${readyCount} incident${readyCount > 1 ? "s" : ""} ready for work order`
                }
              />
            </div>
          </section>
        </div>

        {/* Demo workflow */}
        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Maintenance Workflow</h2>
              <p className="mt-1 text-sm text-slate-400">
                Implemented: Complaint → AI Analysis
                <span className="text-slate-500"> · Planned: Work Order → Dispatch → Completion</span>
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {[
              { label: "Complaint", state: "Live" },
              { label: "AI Analysis", state: "Live" },
              { label: "Work Order", state: "Planned" },
              { label: "Worker Dispatch", state: "Planned" },
              { label: "Completion", state: "Planned" },
            ].map((step, index) => (
              <div
                key={step.label}
                className={`rounded-lg border p-4 ${
                  step.state === "Live"
                    ? "border-emerald-900/50 bg-slate-950"
                    : "border-dashed border-slate-700 bg-slate-950/50 opacity-75"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    STEP {index + 1}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide ${
                      step.state === "Live"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-900"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {step.state.toUpperCase()}
                  </span>
                </div>

                <div className="font-medium">{step.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>

      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function Activity({ title, description }) {
  return (
    <div className="border-l-2 border-slate-700 pl-4">
      <p className="text-sm font-medium">{title}</p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    NEW: "bg-slate-800 text-slate-300 border-slate-700",
    ANALYZING: "bg-amber-950 text-amber-300 border-amber-900",
    NEEDS_INFORMATION: "bg-amber-950 text-amber-300 border-amber-900",
    READY: "bg-emerald-950 text-emerald-300 border-emerald-900",
    ASSIGNED: "bg-blue-950 text-blue-300 border-blue-900",
    IN_PROGRESS: "bg-blue-950 text-blue-300 border-blue-900",
    COMPLETED: "bg-emerald-950 text-emerald-300 border-emerald-900",
    REJECTED: "bg-red-950 text-red-300 border-red-900",
  };
  const cls = styles[status] || "bg-slate-800 text-slate-300 border-slate-700";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    LOW: "bg-slate-800 text-slate-300 border-slate-700",
    MEDIUM: "bg-yellow-950 text-yellow-300 border-yellow-900",
    HIGH: "bg-orange-950 text-orange-300 border-orange-900",
    CRITICAL: "bg-red-950 text-red-300 border-red-900",
  };
  const cls = styles[severity] || "bg-slate-800 text-slate-300 border-slate-700";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {severity}
    </span>
  );
}

function WorkerStatusBadge({ status }) {
  const map = {
    AVAILABLE: "border-emerald-900 bg-emerald-950 text-emerald-300",
    BUSY: "border-amber-900 bg-amber-950 text-amber-300",
    OFFLINE: "border-slate-700 bg-slate-800 text-slate-300",
  };
  const cls = map[status] || "border-slate-700 bg-slate-800 text-slate-300";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function workOrderStatusStyle(status) {
  if (status === "ASSIGNED") return "bg-blue-950 text-blue-300 border-blue-900";
  if (status === "PENDING") return "bg-amber-950 text-amber-300 border-amber-900";
  if (status === "IN_PROGRESS") return "bg-blue-950 text-blue-300 border-blue-900";
  if (status === "COMPLETED") return "bg-emerald-950 text-emerald-300 border-emerald-900";
  return "bg-slate-800 text-slate-300 border-slate-700";
}
