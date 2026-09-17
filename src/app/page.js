"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Reveal from "../components/dashboard/Reveal";
import MetricCard from "../components/dashboard/MetricCard";
import ProgressBar from "../components/dashboard/ProgressBar";
import { ThreeDButton } from "../components/dashboard/ThreeDButton";

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
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}
function SeverityBadge({ severity }) {
  const styles = {
    LOW: "bg-slate-800 text-slate-300 border-slate-700",
    MEDIUM: "bg-yellow-950 text-yellow-300 border-yellow-900",
    HIGH: "bg-orange-950 text-orange-300 border-orange-900",
    CRITICAL: "bg-red-950 text-red-300 border-red-900",
  };
  const cls = styles[severity] || "bg-slate-800 text-slate-300 border-slate-700";
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>{severity}</span>;
}

export default function OverviewPage() {
  const [dashboard, setDashboard] = useState(null);
  const [workersData, setWorkersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState("");
  const [creatingId, setCreatingId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, workersRes] = await Promise.all([
          fetch("/api/dashboard?page=1&limit=5"),
          fetch("/api/workers"),
        ]);
        const dashData = await dashRes.json();
        const workersJson = await workersRes.json();
        if (dashRes.ok) setDashboard(dashData);
        if (workersRes.ok) setWorkersData(workersJson);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const incidentCounts = dashboard?.incidentStatusCounts || {};
  const totalIncidents = dashboard?.totalIncidents || 0;
  const openIncidents = dashboard?.openIncidents || 0;
  const criticalIncidents = dashboard?.criticalIncidents || 0;
  const activeWorkOrders = dashboard?.activeWorkOrders ?? ((dashboard?.pending ?? 0) + (dashboard?.assigned ?? 0) + (dashboard?.inProgress ?? 0));
  const availableWorkers = workersData?.counts?.available ?? 0;
  const totalClients = dashboard?.totalClients ?? 0;
  const totalProperties = dashboard?.totalProperties ?? 0;
  const recentProperties = dashboard?.recentProperties || [];

  const recentIncidents = dashboard?.recentIncidents || [];
  const workerCounts = workersData?.counts || { available: 0, busy: 0, offline: 0, total: 0 };
  const workers = workersData?.workers || [];

  async function handleCreateWorkOrder(id) {
    setCreatingId(id);
    setActionFeedback("");
    try {
      const res = await fetch(`/api/incidents/${id}/work-order`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setActionFeedback(data.worker ? `Assigned to ${data.worker.name}` : "Pending assignment");
      const dashRes = await fetch("/api/dashboard?page=1&limit=5");
      const dashData = await dashRes.json();
      if (dashRes.ok) setDashboard(dashData);
      const wRes = await fetch("/api/workers");
      const wData = await wRes.json();
      if (wRes.ok) setWorkersData(wData);
    } catch (e) {
      setActionFeedback(e.message);
    } finally {
      setCreatingId(null);
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

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Maintenance Operations</h1>
            <p className="mt-1 text-sm text-slate-400">Real-time intelligence across incidents, work orders and field operations.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-900/50 bg-emerald-950/30 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-300">AI Engine Online</span>
            </div>
            <ThreeDButton href="/complaints/new" variant="primary">+ New Complaint</ThreeDButton>
          </div>
        </div>
      </Reveal>

      {/* Summary Metrics - 6 cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Reveal delay={30}>
          <MetricCard
            label="Total Clients"
            value={totalClients}
            sublabel={`${totalProperties} properties`}
            accent="slate"
            icon={<span className="text-sm">◉</span>}
          />
        </Reveal>
        <Reveal delay={60}>
          <MetricCard
            label="Total Properties"
            value={totalProperties}
            sublabel={`${totalClients} clients`}
            accent="slate"
            icon={<span className="text-sm">⬣</span>}
          />
        </Reveal>
        <Reveal delay={90}>
          <MetricCard
            label="Open Incidents"
            value={openIncidents}
            sublabel={`${totalIncidents} total incidents`}
            accent="amber"
            icon={<span className="text-sm">◈</span>}
          />
        </Reveal>
        <Reveal delay={120}>
          <MetricCard
            label="Critical Incidents"
            value={criticalIncidents}
            sublabel="Requires immediate attention"
            accent="red"
            icon={<span className="text-sm">⚠</span>}
          />
        </Reveal>
        <Reveal delay={150}>
          <MetricCard
            label="Active Work Orders"
            value={activeWorkOrders}
            sublabel={`${dashboard?.pending || 0} pending · ${dashboard?.assigned || 0} assigned`}
            accent="blue"
            icon={<span className="text-sm">⧉</span>}
          />
        </Reveal>
        <Reveal delay={180}>
          <MetricCard
            label="Available Workers"
            value={availableWorkers}
            sublabel={`${workerCounts.total} total workers`}
            accent="emerald"
            icon={<span className="text-sm">◎</span>}
          />
        </Reveal>
      </div>

      {/* Properties & Clients - recent operational relationships */}
      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Properties & Clients</h2>
              <p className="text-xs text-slate-500">Recent properties · Client → Property → Asset → Incident chain</p>
            </div>
            <div className="flex gap-2">
              <Link href="/clients" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800">View Clients</Link>
              <Link href="/properties" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800">View Properties</Link>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentProperties.length === 0 ? (
              <p className="col-span-full py-4 text-center text-xs text-slate-500">No properties.</p>
            ) : (
              recentProperties.map((p) => (
                <Link key={p.id} href={`/properties/${p.id}`} className="rounded-lg border border-slate-800 bg-slate-950 p-3 hover:border-slate-700 hover:bg-slate-900 transition">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <p className="text-xs font-mono text-slate-500">{p.propertyCode}</p>
                  <p className="text-xs text-slate-400 truncate">{p.client?.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{p._count?.assets ?? 0} assets · {p._count?.incidents ?? 0} incidents</p>
                </Link>
              ))
            )}
          </div>
        </div>
      </Reveal>

      {/* Operations Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-700">
            <h2 className="text-sm font-semibold text-white">Incident Activity</h2>
            <p className="text-xs text-slate-500">Distribution by status</p>
            <div className="mt-5 space-y-3">
              {[
                { label: "NEW", count: incidentCounts.NEW || 0, color: "slate" },
                { label: "ANALYZING", count: incidentCounts.ANALYZING || 0, color: "amber" },
                { label: "NEEDS INFORMATION", count: incidentCounts.NEEDS_INFORMATION || 0, color: "amber" },
                { label: "READY", count: incidentCounts.READY || 0, color: "emerald" },
                { label: "ASSIGNED", count: incidentCounts.ASSIGNED || 0, color: "blue" },
                { label: "IN PROGRESS", count: incidentCounts.IN_PROGRESS || 0, color: "blue" },
                { label: "COMPLETED", count: incidentCounts.COMPLETED || 0, color: "emerald" },
              ].map((item) => {
                const percent = totalIncidents ? Math.round((item.count / totalIncidents) * 100) : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{item.label}</span>
                      <span className="text-slate-500">{item.count} · {percent}%</span>
                    </div>
                    <ProgressBar value={percent} color={item.color} />
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-700">
            <h2 className="text-sm font-semibold text-white">Worker Availability</h2>
            <p className="text-xs text-slate-500">Real worker database</p>
            <div className="mt-5 space-y-4">
              {[
                { label: "AVAILABLE", count: workerCounts.available, total: workerCounts.total, color: "emerald" },
                { label: "BUSY", count: workerCounts.busy, total: workerCounts.total, color: "amber" },
                { label: "OFFLINE", count: workerCounts.offline, total: workerCounts.total, color: "slate" },
              ].map((item) => {
                const percent = item.total ? Math.round((item.count / item.total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-medium text-slate-300">
                        <span className={`h-2 w-2 rounded-full ${item.color === "emerald" ? "bg-emerald-500" : item.color === "amber" ? "bg-amber-500" : "bg-slate-500"}`}></span>
                        {item.label}
                      </span>
                      <span className="text-slate-500">{item.count} · {percent}%</span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar value={percent} color={item.color} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex gap-2">
              <ThreeDButton href="/workers" variant="secondary" className="flex-1 justify-center">View Workers</ThreeDButton>
              <ThreeDButton href="/workers/new" variant="primary" className="flex-1 justify-center">Add Worker</ThreeDButton>
            </div>
          </div>
        </Reveal>
      </div>

      {/* AI → Operations workflow */}
      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-widest text-slate-500">AI → OPERATIONS FLOW</p>
            <p className="text-xs text-slate-600">AI understands · Rules decide · Workers execute</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {["AI Intelligence", "Validation", "Deterministic Rules", "Worker Assignment", "Work Order"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className={`rounded-full border px-3 py-1 font-medium ${i < 2 ? "border-emerald-900 bg-emerald-950/40 text-emerald-300" : "border-slate-700 bg-slate-800 text-slate-300"}`}>
                  {step}
                </span>
                {i < 4 && <span className="text-slate-600">→</span>}
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Recent Incidents & Active Work Orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Recent Incidents</h2>
                <p className="text-xs text-slate-500">Latest 5 incidents</p>
              </div>
              <Link href="/incidents" className="text-xs font-medium text-slate-300 hover:text-white transition-colors">
                View all →
              </Link>
            </div>
            {actionFeedback && (
              <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-300">
                {actionFeedback}
              </div>
            )}
            <div className="mt-4 space-y-2">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="group flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 transition-all hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{incident.description}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {incident.category && <span className="rounded-full border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-xs text-slate-400">{incident.category}</span>}
                      {incident.severity && <SeverityBadge severity={incident.severity} />}
                      <StatusBadge status={incident.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {incident.client?.name ? `${incident.client.name} → ` : ""}{incident.property?.name || incident.property?.propertyCode || "No property"} {incident.asset?.assetCode ? `· ${incident.asset.assetCode}` : ""} {incident.reporterName ? `· ${incident.reporterName}` : ""}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">{incident.location} · {new Date(incident.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {incident.status === "READY" && !incident.workOrder ? (
                      <button
                        onClick={() => handleCreateWorkOrder(incident.id)}
                        disabled={creatingId === incident.id}
                        className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50 shadow-[0_2px_0_0_rgb(15_23_42)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                      >
                        {creatingId === incident.id ? "..." : "Create"}
                      </button>
                    ) : incident.workOrder ? (
                      <div className="text-right">
                        {incident.workOrder.status === "PENDING" && <span className="text-xs font-medium text-amber-400">Awaiting worker assignment</span>}
                        {incident.workOrder.status === "ASSIGNED" && incident.workOrder.worker && <span className="text-xs font-medium text-sky-300">Assigned to {incident.workOrder.worker.name}</span>}
                        {incident.workOrder.status === "IN_PROGRESS" && incident.workOrder.worker && <span className="text-xs font-medium text-blue-300">{incident.workOrder.worker.name} is working</span>}
                        {incident.workOrder.status === "COMPLETED" && incident.workOrder.worker && <span className="text-xs font-medium text-emerald-400">Completed by {incident.workOrder.worker.name}</span>}
                        {incident.workOrder.worker && <Link href={`/workers/${incident.workOrder.worker.id}`} className="block text-xs text-slate-500 hover:text-slate-300">{incident.workOrder.status}</Link>}
                        {!incident.workOrder.worker && incident.workOrder.status !== "PENDING" && <span className="text-xs text-slate-500">{incident.workOrder.status}</span>}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {recentIncidents.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No incidents yet.</p>}
            </div>
          </div>
        </Reveal>

        <div className="space-y-6">
          <Reveal>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Active Work Orders</h2>
                  <p className="text-xs text-slate-500">{dashboard?.activeWorkOrders || 0} active</p>
                </div>
                <Link href="/work-orders" className="text-xs font-medium text-slate-300 hover:text-white">View all →</Link>
              </div>
              <div className="mt-4 space-y-2">
                {(dashboard?.recentIncidents || []).filter((i) => i.workOrder && ["PENDING","ASSIGNED","IN_PROGRESS"].includes(i.workOrder.status)).slice(0, 3).map((incident) => {
                  const wo = incident.workOrder;
                  let assignmentLabel = "Awaiting worker assignment";
                  if (wo.status === "PENDING") assignmentLabel = "Awaiting worker assignment";
                  else if (wo.status === "ASSIGNED" && wo.worker) assignmentLabel = `Assigned to ${wo.worker.name}`;
                  else if (wo.status === "IN_PROGRESS" && wo.worker) assignmentLabel = `${wo.worker.name} is working`;
                  else if (wo.status === "COMPLETED" && wo.worker) assignmentLabel = `Completed by ${wo.worker.name}`;
                  else if (wo.worker) assignmentLabel = `${wo.worker.name} · ${wo.status}`;
                  return (
                    <div key={wo.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 transition hover:border-slate-700">
                      <p className="truncate text-sm font-medium text-white">{incident.issue || incident.description}</p>
                      <p className="truncate text-xs text-slate-400">{wo.priority} · {incident.location} {incident.asset?.assetCode ? `· ${incident.asset.assetCode}` : ""}</p>
                      <p className={`mt-1 text-xs font-medium ${wo.status === "PENDING" ? "text-amber-400" : wo.status === "IN_PROGRESS" ? "text-blue-300" : "text-emerald-300"}`}>{assignmentLabel}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full border px-1.5 py-0.5 text-xs ${wo.status === "IN_PROGRESS" ? "border-blue-900 bg-blue-950 text-blue-300" : wo.status === "ASSIGNED" ? "border-sky-900 bg-sky-950 text-sky-300" : "border-amber-900 bg-amber-950 text-amber-300"}`}>Status: {wo.status}</span>
                        <span className="text-xs text-slate-500">SLA {wo.slaHours}h</span>
                      </div>
                    </div>
                  );
                })}
                {(!dashboard || (dashboard.recentIncidents || []).filter((i) => i.workOrder && ["PENDING","ASSIGNED","IN_PROGRESS"].includes(i.workOrder.status)).length === 0) && (
                  <p className="py-4 text-center text-xs text-slate-500">No active work orders.</p>
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-sm font-semibold text-white">AI Intelligence</h2>
              <p className="text-xs text-slate-500">Recent analysis · Indeterminate when ANALYZING</p>
              <div className="mt-4 space-y-3">
                {recentIncidents.slice(0, 4).map((inc) => {
                  const isAnalyzing = inc.status === "ANALYZING";
                  return (
                    <div key={`ai-${inc.id}`} className="flex gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
                      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isAnalyzing ? "bg-amber-500 relative" : inc.status === "READY" ? "bg-emerald-500" : inc.status === "NEEDS_INFORMATION" ? "bg-amber-500" : inc.severity === "CRITICAL" ? "bg-red-500" : "bg-sky-500"}`}>
                        {isAnalyzing && <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-amber-400 opacity-75"></span>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">
                          {isAnalyzing ? "AI analyzing..." : inc.status === "READY" ? "AI analysis complete — ready for work order" : inc.status === "NEEDS_INFORMATION" ? "AI needs more information" : inc.severity === "CRITICAL" ? "Critical incident detected" : inc.severity === "HIGH" ? "High severity identified" : "Complaint analyzed"}
                        </p>
                        <p className="truncate text-xs text-slate-500">{isAnalyzing ? "Analyzing complaint..." : `${inc.issue || inc.category} · ${inc.confidence ? `${Math.round(inc.confidence*100)}% confidence` : "analyzed"}`}</p>
                      </div>
                    </div>
                  );
                })}
                {recentIncidents.length === 0 && <p className="py-4 text-center text-xs text-slate-500">No analysis yet.</p>}
                <Link href="/ai" className="block text-center text-xs font-medium text-slate-400 hover:text-white">View AI analysis →</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
