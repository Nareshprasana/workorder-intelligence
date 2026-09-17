"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import Reveal from "../../../components/dashboard/Reveal";

function NewComplaintForm() {
  const [residents, setResidents] = useState([]);
  const [assets, setAssets] = useState([]);

  const [residentId, setResidentId] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [assetId, setAssetId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [submittedIncident, setSubmittedIncident] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    async function load() {
      const [resRes, assetRes] = await Promise.all([fetch("/api/residents"), fetch("/api/assets")]);
      const resData = await resRes.json();
      const assetData = await assetRes.json();
      if (resRes.ok) setResidents((resData.residents || []).filter((r) => r.status === "ACTIVE"));
      if (assetRes.ok) setAssets(assetData.assets || []);
    }
    load();
  }, []);

  useEffect(() => {
    if (residentId) {
      const r = residents.find((x) => x.id === residentId);
      if (r && !location) {
        setLocation(`${r.building}, ${r.apartment}`);
      }
    }
  }, [residentId, residents, location]);

  async function triggerAnalysis(incidentId, isRetry = false) {
    setAiStatus("ANALYZING");
    setAiError("");
    setRetrying(isRetry);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRetry ? { retry: true } : {}),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || "AI analysis temporarily unavailable");
      const finalStatus = data.incident?.status || data.status;
      setAiStatus(finalStatus);
      setAiResult(data.incident);
      // If workOrder was auto-created, we could show note, but handled in READY card
    } catch (err) {
      setAiStatus("ERROR");
      setAiError(err.message || "AI analysis temporarily unavailable");
    } finally {
      setRetrying(false);
    }
  }

  async function handleRetry() {
    if (!submittedIncident) return;
    await triggerAnalysis(submittedIncident.id, true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setAiError("");
    setAiResult(null);
    setAiStatus(null);
    setSubmittedIncident(null);

    if (!residentId) {
      setError("Please select a resident.");
      return;
    }
    if (!description.trim() || !location.trim()) {
      setError("Please enter the complaint and location.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ residentId, location, description, assetId: assetId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create complaint");
      const incident = data.incident;
      setSubmittedIncident(incident);
      await triggerAnalysis(incident.id, false);
    } catch (err) {
      setError(err.message || "Unable to submit complaint.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSubmittedIncident(null);
    setAiStatus(null);
    setAiResult(null);
    setAiError("");
    setError("");
    setDescription("");
    setAssetId("");
    // keep resident and location
  }

  let missingInfo = [];
  if (aiResult?.aiAnalysis) {
    try {
      const parsed = JSON.parse(aiResult.aiAnalysis);
      missingInfo = parsed.missingInformation || [];
    } catch {}
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/" className="text-sm text-slate-400 hover:text-white">← Back to Dashboard</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">New Complaint</h1>
        <p className="mt-1 text-sm text-slate-400">Resident submits maintenance complaint · stored immediately · AI analyzes</p>
      </div>

      {!submittedIncident ? (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Resident *</label>
            <select value={residentId} onChange={(e) => setResidentId(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600">
              <option value="">Select a resident</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>{r.name} · {r.building}, {r.apartment} {r.status === "INACTIVE" ? "(INACTIVE)" : ""}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Resident must be ACTIVE. Server validates.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Location *</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Example: Block B, Room 401" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Complaint description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Example: AC is not cooling and water is leaking." rows={5} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Asset <span className="text-slate-500">(optional)</span></label>
            <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600">
              <option value="">No asset (general complaint)</option>
              {assets.map((a) => (
                <option key={a.id} value={a.assetCode}>{a.assetCode} · {a.name} · {a.category}</option>
              ))}
            </select>
          </div>

          {error && <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50 shadow-[0_3px_0_0_rgb(15_23_42)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <Reveal>
            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-sm">✓</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-300">Complaint submitted</p>
                  <p className="mt-1 text-sm text-slate-300">Complaint #{submittedIncident.id.slice(0, 8)} · {submittedIncident.id}</p>
                  <p className="text-xs text-slate-500">{submittedIncident.description.slice(0, 80)}</p>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/complaints/${submittedIncident.id}`} className="rounded-lg border border-emerald-900 bg-emerald-950 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/50">View Complaint →</Link>
                    <button onClick={resetForm} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">New Complaint</button>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {aiStatus === "ANALYZING" && (
            <Reveal>
              <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-6">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span></span>
                  <p className="text-sm font-medium text-amber-300">AI is analyzing your complaint...</p>
                </div>
                <p className="mt-2 text-xs text-slate-500">Incident is safely stored as ANALYZING.</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-amber-600 to-amber-400 opacity-60"></div></div>
              </div>
            </Reveal>
          )}

          {aiStatus === "ERROR" && (
            <Reveal>
              <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
                <p className="text-sm font-semibold text-red-300">AI analysis temporarily unavailable.</p>
                <p className="mt-1 text-xs text-slate-400">Complaint saved, but AI analysis is temporarily unavailable.</p>
                <p className="mt-1 text-xs text-red-300">{aiError}</p>
                <button onClick={handleRetry} disabled={retrying} className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-200 disabled:opacity-50 shadow-[0_3px_0_0_rgb(15_23_42)]">{retrying ? "Retrying..." : "Retry AI Analysis"}</button>
              </div>
            </Reveal>
          )}

          {aiStatus === "READY" && aiResult && (
            <Reveal>
              <div className="rounded-xl border border-emerald-900/50 bg-slate-900 p-6 shadow-lg">
                <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">✓</span><p className="text-sm font-semibold text-emerald-300">AI Analysis Complete</p><span className="ml-auto rounded-full border border-emerald-900 bg-emerald-950 px-2 py-0.5 text-xs text-emerald-300">READY</span></div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Category</p><p className="font-medium text-white">{aiResult.category}</p></div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Severity</p><p className="font-medium text-white">{aiResult.severity}</p></div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Confidence</p><p className="font-medium text-white">{aiResult.confidence ? `${Math.round(aiResult.confidence * 100)}%` : "—"}</p></div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Issue</p><p className="font-medium text-white">{aiResult.issue || "—"}</p></div>
                </div>
                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Recommended action</p><p className="mt-1 text-sm text-white">{aiResult.recommendedAction || "—"}</p></div>
                <p className="mt-2 text-xs text-slate-500">Work request will be created automatically and assigned to an appropriate worker.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/complaints/${submittedIncident.id}`} className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-200 shadow-[0_3px_0_0_rgb(15_23_42)]">View Complaint</Link>
                  <button onClick={resetForm} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800">Submit Another</button>
                </div>
              </div>
            </Reveal>
          )}

          {aiStatus === "NEEDS_INFORMATION" && aiResult && (
            <Reveal>
              <div className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-6">
                <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs">⚠</span><p className="text-sm font-semibold text-amber-300">More Information Required</p><span className="ml-auto rounded-full border border-amber-900 bg-amber-950 px-2 py-0.5 text-xs text-amber-300">NEEDS_INFORMATION</span></div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Category</p><p className="font-medium text-white">{aiResult.category}</p></div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Confidence</p><p className="font-medium text-white">{aiResult.confidence ? `${Math.round(aiResult.confidence * 100)}%` : "—"}</p></div>
                </div>
                {missingInfo.length > 0 && <div className="mt-3 rounded-lg border border-amber-900/50 bg-slate-950 p-3"><p className="text-xs font-medium text-amber-300">Missing information:</p><ul className="mt-1 list-disc pl-5 text-sm text-slate-300">{missingInfo.map((m,i)=>(<li key={i} className="text-xs">{m}</li>))}</ul></div>}
                <div className="mt-4 flex gap-2"><Link href={`/complaints/${submittedIncident.id}`} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800">View Complaint</Link><button onClick={resetForm} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800">Submit Another</button></div>
                <p className="mt-2 text-xs text-amber-400">More information is required before a work request can be created.</p>
              </div>
            </Reveal>
          )}
          {error && <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
        </div>
      )}
    </div>
  );
}

export default function NewComplaintPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-6 text-sm text-slate-400">Loading form...</div>}>
      <NewComplaintForm />
    </Suspense>
  );
}
