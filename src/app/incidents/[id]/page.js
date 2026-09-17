"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Reveal from "../../../components/dashboard/Reveal";

function Step({ title, desc, state }) {
  // state: done | active | pending
  const color =
    state === "done"
      ? "border-emerald-900 bg-emerald-950 text-emerald-300"
      : state === "active"
        ? "border-amber-900 bg-amber-950 text-amber-300 animate-pulse"
        : "border-slate-800 bg-slate-900 text-slate-500";
  const dot = state === "done" ? "✓" : state === "active" ? "●" : "○";
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${color}`}>{dot}</span>
        <span className="mt-1 h-8 w-px bg-slate-800"></span>
      </div>
      <div className="pb-4">
        <p className={`text-sm font-medium ${state === "pending" ? "text-slate-500" : "text-white"}`}>{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

export default function IncidentDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [retryError, setRetryError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/incidents/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setIncident(data.incident);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAnalyzeRetry() {
    setAnalyzing(true);
    setRetryError("");
    try {
      const res = await fetch(`/api/incidents/${id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retry: true }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || "AI analysis temporarily unavailable");
      await load();
    } catch (e) {
      setRetryError(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleCreateWorkOrder() {
    setCreating(true);
    setCreateMsg("");
    try {
      const res = await fetch(`/api/incidents/${id}/work-order`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create work order");
      setCreateMsg(data.worker ? `Work order created — Assigned to ${data.worker.name}` : "Work order created — Awaiting worker assignment");
      await load();
    } catch (e) {
      setCreateMsg(e.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-xl bg-slate-900"></div>
        <div className="h-64 animate-pulse rounded-xl bg-slate-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/incidents" className="text-sm text-slate-400 hover:text-white">← Back to Incidents</Link>
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center text-sm text-red-300">{error}</div>
      </div>
    );
  }

  if (!incident) return <p className="text-sm text-slate-500">Not found</p>;

  let analysis = null;
  try {
    analysis = incident.aiAnalysis ? JSON.parse(incident.aiAnalysis) : null;
  } catch {}

  const status = incident.status;
  const hasWO = !!incident.workOrder;
  const worker = incident.workOrder?.worker;

  // Timeline states
  const complaintDone = true;
  const aiDone = ["READY", "NEEDS_INFORMATION", "ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(status);
  const aiActive = status === "ANALYZING" || status === "NEW";
  const validationDone = ["READY", "ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(status);
  const validationNeeds = status === "NEEDS_INFORMATION";
  const woDone = !!hasWO;
  const workerDone = !!worker;
  const completedDone = status === "COMPLETED" || incident.workOrder?.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <Reveal>
        <Link href="/incidents" className="text-sm text-slate-400 hover:text-white">← Back to Incidents</Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-slate-500">INCIDENT LIFECYCLE</p>
            <h1 className="mt-1 text-xl font-bold text-white">{incident.issue || incident.description.slice(0, 60)}</h1>
            <p className="text-xs font-mono text-slate-500">Incident {incident.id}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${status === "READY" ? "border-emerald-900 bg-emerald-950 text-emerald-300" : status === "ANALYZING" ? "border-amber-900 bg-amber-950 text-amber-300" : status === "NEEDS_INFORMATION" ? "border-amber-900 bg-amber-950 text-amber-300" : status === "NEW" ? "border-slate-700 bg-slate-800 text-slate-300" : "border-slate-700 bg-slate-800 text-slate-300"}`}>{status}</span>
        </div>
      </Reveal>

      {/* Workflow Timeline */}
      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Workflow</h2>
          <p className="text-xs text-slate-500">Client → Property → Asset → Complaint → AI Analysis → Validation → Work Order → Worker → Completion</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <Step title="Complaint Received" desc={`${incident.client?.name || "No client"} → ${incident.property?.name || "No property"}${incident.asset ? ` → ${incident.asset.assetCode}` : ""}`} state={complaintDone ? "done" : "pending"} />
              <Step
                title="AI Analysis"
                desc={status === "ANALYZING" ? "AI analyzing..." : aiDone ? `Category ${incident.category || analysis?.category || "—"} · Confidence ${incident.confidence ? Math.round(incident.confidence * 100) + "%" : "—"}` : status === "NEW" ? "Not yet analyzed" : "Awaiting AI"}
                state={aiDone ? "done" : aiActive ? "active" : "pending"}
              />
              <Step
                title="Validation"
                desc={validationDone ? "Information sufficient — READY" : validationNeeds ? "Needs more information" : "Pending validation"}
                state={validationDone ? "done" : validationNeeds ? "active" : "pending"}
              />
              <Step title="Work Order" desc={woDone ? `${incident.workOrder.status} · SLA ${incident.workOrder.slaHours}h · Priority ${incident.workOrder.priority}` : "Not yet created"} state={woDone ? "done" : "pending"} />
              <Step title="Worker" desc={workerDone ? `${worker.name} · ${worker.status} · ${incident.workOrder.status === "IN_PROGRESS" ? "is working" : incident.workOrder.status}` : hasWO && incident.workOrder.status === "PENDING" ? "Awaiting worker assignment" : "Not assigned"} state={workerDone ? "done" : hasWO && incident.workOrder.status === "PENDING" ? "active" : "pending"} />
              <div className="flex gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${completedDone ? "border-emerald-900 bg-emerald-950 text-emerald-300" : "border-slate-800 bg-slate-900 text-slate-500"}`}>{completedDone ? "✓" : "○"}</span>
                <div>
                  <p className={`text-sm font-medium ${completedDone ? "text-white" : "text-slate-500"}`}>Completion</p>
                  <p className="text-xs text-slate-500">{completedDone ? "Completed" : "Pending"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="text-xs font-semibold tracking-widest text-slate-500">CHAIN</h3>
              <div className="space-y-2 text-sm">
                <div><p className="text-xs text-slate-500">CLIENT</p><p className="text-white">{incident.client?.name || "—"} {incident.client?.companyName ? `· ${incident.client.companyName}` : ""}</p></div>
                <div><p className="text-xs text-slate-500">PROPERTY</p><p className="text-white">{incident.property ? `${incident.property.name} (${incident.property.propertyCode})` : "—"}</p><p className="text-xs text-slate-500">{incident.property?.address || ""}</p></div>
                <div><p className="text-xs text-slate-500">ASSET</p><p className="text-white">{incident.asset ? `${incident.asset.name} · ${incident.asset.assetCode} · ${incident.asset.category}` : "—"}</p><p className="text-xs text-slate-500">{incident.asset?.location || ""}</p></div>
                <div><p className="text-xs text-slate-500">COMPLAINT</p><p className="text-white">{incident.description}</p><p className="text-xs text-slate-500">{incident.location} · Reporter: {incident.reporterName || "—"} {incident.reporterEmail ? `· ${incident.reporterEmail}` : ""}</p></div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* AI Analysis Section */}
      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">AI Analysis</h2>
          {status === "ANALYZING" && (
            <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/20 p-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                </span>
                <p className="text-sm font-medium text-amber-300">AI Analysis in progress</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">Gemini is analyzing category, severity, confidence and recommended action. Incident remains safely stored.</p>
              <button onClick={handleAnalyzeRetry} disabled={analyzing} className="mt-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50">
                {analyzing ? "Retrying..." : "Retry AI Analysis"}
              </button>
              {retryError && <p className="mt-2 text-xs text-red-300">{retryError}</p>}
            </div>
          )}
          {status === "NEW" && (
            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Incident is NEW — AI analysis not yet started.</p>
              <button onClick={handleAnalyzeRetry} disabled={analyzing} className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50">
                {analyzing ? "Analyzing..." : "Start AI Analysis"}
              </button>
              {retryError && <p className="mt-2 text-xs text-red-300">{retryError}</p>}
            </div>
          )}
          {(status === "READY" || status === "NEEDS_INFORMATION") && (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="text-sm font-medium text-white">{incident.category || analysis?.category || "—"}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Issue</p>
                  <p className="text-sm font-medium text-white">{incident.issue || analysis?.issue || "—"}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Severity</p>
                  <p className="text-sm font-medium text-white">{incident.severity || analysis?.severity || "—"}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Confidence</p>
                  <p className="text-sm font-medium text-white">{incident.confidence ? `${Math.round(incident.confidence * 100)}%` : analysis?.confidence ? `${Math.round(analysis.confidence * 100)}%` : "—"}</p>
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs text-slate-500">Recommended Action</p>
                <p className="text-sm text-white">{incident.recommendedAction || analysis?.recommendedAction || "—"}</p>
              </div>
              {analysis?.missingInformation?.length > 0 && (
                <div className="rounded-lg border border-amber-900/50 bg-amber-950/10 p-3">
                  <p className="text-xs font-medium text-amber-300">Missing information</p>
                  <ul className="mt-1 list-disc pl-5 text-xs text-slate-300">
                    {analysis.missingInformation.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
              {incident.aiAnalysis && (
                <details className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <summary className="cursor-pointer text-xs font-medium text-slate-300">Raw AI analysis</summary>
                  <pre className="mt-2 overflow-x-auto text-xs text-slate-400">{JSON.stringify(analysis, null, 2)}</pre>
                </details>
              )}
              <div className="flex gap-2">
                <button onClick={handleAnalyzeRetry} disabled={analyzing} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50">
                  {analyzing ? "Retrying..." : "Retry AI Analysis"}
                </button>
                {retryError && <span className="text-xs text-red-300 self-center">{retryError}</span>}
              </div>
            </div>
          )}
          {(status === "ASSIGNED" || status === "IN_PROGRESS" || status === "COMPLETED") && !analysis && (
            <p className="mt-4 text-sm text-slate-500">Incident already operationalized — AI analysis was {incident.category ? `Category ${incident.category}` : "completed"}.</p>
          )}
        </div>
      </Reveal>

      {/* Work Order Action */}
      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Work Order</h2>
          {hasWO ? (
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-medium text-white">Work Order {incident.workOrder.id.slice(0, 8)} · {incident.workOrder.status}</p>
              <p className="text-xs text-slate-500">Priority {incident.workOrder.priority} · SLA {incident.workOrder.slaHours}h · Action: {incident.workOrder.action}</p>
              <p className="mt-1 text-xs font-medium text-sky-300">
                {incident.workOrder.status === "PENDING" ? "Awaiting worker assignment" : incident.workOrder.worker ? `Assigned to ${incident.workOrder.worker.name} · ${incident.workOrder.worker.location}` : "—"}
              </p>
              {worker && <Link href={`/workers/${worker.id}`} className="mt-2 inline-block rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800">View Worker →</Link>}
            </div>
          ) : (
            <div className="mt-3">
              {status === "READY" ? (
                <div>
                  <p className="text-xs text-slate-500">AI analysis complete — ready for work order (deterministic rules apply).</p>
                  <button onClick={handleCreateWorkOrder} disabled={creating} className="mt-3 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-200 disabled:opacity-50 shadow-[0_3px_0_0_rgb(15_23_42)]">
                    {creating ? "Creating..." : "Create Work Order"}
                  </button>
                  {createMsg && <p className="mt-2 text-xs text-slate-300">{createMsg}</p>}
                </div>
              ) : status === "NEEDS_INFORMATION" ? (
                <p className="text-xs rounded-lg border border-amber-900/50 bg-amber-950/20 p-3 text-amber-300">More information is required before a work order can be created.</p>
              ) : status === "ANALYZING" ? (
                <p className="text-xs text-slate-500">AI analyzing — work order unavailable until READY.</p>
              ) : (
                <p className="text-xs text-slate-500">Work order creation unavailable in current state: {status}</p>
              )}
              {createMsg && status !== "READY" && <p className="mt-2 text-xs text-red-300">{createMsg}</p>}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
