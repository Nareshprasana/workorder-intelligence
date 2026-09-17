"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Reveal from "../../../components/dashboard/Reveal";

export default function ComplaintDetailPage() {
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

  useEffect(() => { load(); }, [id]);

  async function handleRetry() {
    setAnalyzing(true);
    setRetryError("");
    try {
      const res = await fetch(`/api/incidents/${id}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ retry: true }) });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || "AI analysis temporarily unavailable");
      await load();
    } catch (e) { setRetryError(e.message); } finally { setAnalyzing(false); }
  }

  async function handleCreate() {
    setCreating(true);
    setCreateMsg("");
    try {
      const res = await fetch(`/api/incidents/${id}/work-order`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCreateMsg(data.worker ? `Assigned to ${data.worker.name}` : "Awaiting worker assignment");
      await load();
    } catch (e) { setCreateMsg(e.message); } finally { setCreating(false); }
  }

  if (loading) return <div className="space-y-6"><div className="h-24 animate-pulse rounded-xl bg-slate-900"></div></div>;
  if (error) return <div className="p-6 text-sm text-red-300">{error}</div>;
  if (!incident) return <p className="text-sm text-slate-500">Not found</p>;

  let analysis = null;
  try { analysis = incident.aiAnalysis ? JSON.parse(incident.aiAnalysis) : null; } catch {}

  const status = incident.status;
  const hasWO = !!incident.workOrder;

  return (
    <div className="space-y-6">
      <Reveal>
        <Link href="/" className="text-sm text-slate-400 hover:text-white">← Back to Dashboard</Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-slate-500">COMPLAINT</p>
            <h1 className="mt-1 text-xl font-bold text-white">{incident.issue || incident.description.slice(0, 60)}</h1>
            <p className="text-xs font-mono text-slate-500">{incident.id}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${status === "READY" ? "border-emerald-900 bg-emerald-950 text-emerald-300" : status === "ANALYZING" ? "border-amber-900 bg-amber-950 text-amber-300" : status === "NEEDS_INFORMATION" ? "border-amber-900 bg-amber-950 text-amber-300" : "border-slate-700 bg-slate-800 text-slate-300"}`}>{status}</span>
        </div>
      </Reveal>

      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Resident</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Name</p><p className="font-medium text-white">{incident.resident?.name || incident.reporterName || "—"}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Apartment / Unit</p><p className="font-medium text-white">{incident.resident?.apartment || "—"}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Building / Block</p><p className="font-medium text-white">{incident.resident?.building || "—"}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Contact</p><p className="text-white">{incident.resident?.phone || incident.reporterPhone || "—"} {incident.resident?.email ? `· ${incident.resident.email}` : ""}</p></div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Complaint</h2>
          <div className="mt-3 space-y-3 text-sm">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Description</p><p className="text-white">{incident.description}</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Location</p><p className="text-white">{incident.location}</p></div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Asset</p><p className="text-white">{incident.asset ? `${incident.asset.name} · ${incident.asset.assetCode}` : "—"}</p></div>
            </div>
            <p className="text-xs text-slate-500">Created {new Date(incident.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">AI Analysis</h2>
          {status === "ANALYZING" && <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/20 p-4"><div className="flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span></span><p className="text-sm font-medium text-amber-300">AI Analysis in progress</p></div><button onClick={handleRetry} disabled={analyzing} className="mt-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50">{analyzing ? "Retrying..." : "Retry AI Analysis"}</button>{retryError && <p className="mt-2 text-xs text-red-300">{retryError}</p>}</div>}
          {status === "NEW" && <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-4"><p className="text-sm text-slate-400">Not yet analyzed.</p><button onClick={handleRetry} disabled={analyzing} className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50">{analyzing ? "Analyzing..." : "Start AI Analysis"}</button></div>}
          {(status === "READY" || status === "NEEDS_INFORMATION") && (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Category</p><p className="text-sm font-medium text-white">{incident.category || analysis?.category || "—"}</p></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Severity</p><p className="text-sm font-medium text-white">{incident.severity || "—"}</p></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Confidence</p><p className="text-sm font-medium text-white">{incident.confidence ? `${Math.round(incident.confidence * 100)}%` : "—"}</p></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Issue</p><p className="text-sm font-medium text-white">{incident.issue || "—"}</p></div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Recommended Action</p><p className="text-sm text-white">{incident.recommendedAction || "—"}</p></div>
              {analysis?.missingInformation?.length > 0 && <div className="rounded-lg border border-amber-900/50 bg-amber-950/10 p-3"><p className="text-xs font-medium text-amber-300">Missing information</p><ul className="mt-1 list-disc pl-5 text-xs text-slate-300">{analysis.missingInformation.map((m,i)=>(<li key={i}>{m}</li>))}</ul></div>}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Work Request</h2>
          {hasWO ? (
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-medium text-white">{incident.workOrder.id.slice(0,8)} · {incident.workOrder.status} · {incident.workOrder.priority} · SLA {incident.workOrder.slaHours}h</p>
              <p className="text-xs text-slate-500">{incident.workOrder.action}</p>
              <p className="mt-1 text-xs font-medium text-sky-300">{incident.workOrder.status === "PENDING" ? "Awaiting worker assignment" : incident.workOrder.worker ? `Assigned to ${incident.workOrder.worker.name}` : "—"}</p>
              {incident.workOrder.worker && <Link href={`/workers/${incident.workOrder.worker.id}`} className="mt-2 inline-block rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800">View Worker →</Link>}
            </div>
          ) : status === "READY" ? <div><p className="text-xs text-slate-500">Ready — work request should have been created automatically.</p><button onClick={handleCreate} disabled={creating} className="mt-3 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-200 disabled:opacity-50">{creating ? "Creating..." : "Create Work Request"}</button>{createMsg && <p className="mt-2 text-xs text-slate-300">{createMsg}</p>}</div> : status === "NEEDS_INFORMATION" ? <p className="text-xs rounded-lg border border-amber-900/50 bg-amber-950/20 p-3 text-amber-300">More information required before work request.</p> : <p className="text-xs text-slate-500">Awaiting AI — work request unavailable.</p>}
        </div>
      </Reveal>
    </div>
  );
}
