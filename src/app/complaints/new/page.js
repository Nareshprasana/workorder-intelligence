"use client";

/* eslint-disable react-hooks/set-state-in-effect -- cascading Client→Property→Asset selects require synchronizing derived state (reset asset, auto-fill location) when property changes */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Reveal from "../../../components/dashboard/Reveal";

function NewComplaintForm() {
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId");

  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [assets, setAssets] = useState([]);

  const [clientId, setClientId] = useState("");
  const [propertyId, setPropertyId] = useState(initialPropertyId || "");
  const [assetId, setAssetId] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // AI workflow states
  const [submittedIncident, setSubmittedIncident] = useState(null);
  const [aiStatus, setAiStatus] = useState(null); // null | ANALYZING | READY | NEEDS_INFORMATION | ERROR
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      const [clientsRes, assetsRes] = await Promise.all([fetch("/api/clients"), fetch("/api/assets")]);
      const clientsData = await clientsRes.json();
      const assetsData = await assetsRes.json();
      if (clientsRes.ok) {
        const activeClients = (clientsData.clients || []).filter((c) => c.status === "ACTIVE");
        setClients(activeClients);
        if (initialPropertyId) {
          const propRes = await fetch(`/api/properties/${initialPropertyId}`);
          if (propRes.ok) {
            const propData = await propRes.json();
            if (propData.property) {
              setClientId(propData.property.clientId);
            }
          }
        }
      }
      if (assetsRes.ok) setAssets(assetsData.assets || []);
    }
    loadInitial();
  }, [initialPropertyId]);

  useEffect(() => {
    async function loadProperties() {
      if (!clientId) {
        setProperties([]);
        if (!initialPropertyId) setPropertyId("");
        return;
      }
      const res = await fetch(`/api/properties?clientId=${clientId}`);
      const data = await res.json();
      if (res.ok) {
        setProperties(data.properties || []);
        if (propertyId && !data.properties.find((p) => p.id === propertyId)) {
          setPropertyId("");
          setAssetId("");
        }
      }
    }
    loadProperties();
  }, [clientId, propertyId, initialPropertyId]);

  useEffect(() => {
    if (!propertyId) {
      setAssetId("");
      return;
    }
    const prop = properties.find((p) => p.id === propertyId);
    if (prop && !location) {
      setLocation(prop.address);
    }
    if (assetId) {
      const asset = assets.find((a) => a.assetCode === assetId);
      if (asset && asset.propertyId && asset.propertyId !== propertyId) {
        setAssetId("");
      }
    }
  }, [propertyId, properties, location, assetId, assets]);

  const filteredAssets = propertyId ? assets.filter((a) => !a.propertyId || a.propertyId === propertyId) : [];

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
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "AI analysis temporarily unavailable");
      }
      // data.incident has final status READY or NEEDS_INFORMATION or ANALYZING (dedup)
      const finalStatus = data.incident?.status || data.status;
      if (finalStatus === "ANALYZING") {
        setAiStatus("ANALYZING");
        setAiResult(data.incident);
      } else if (finalStatus === "READY") {
        setAiStatus("READY");
        setAiResult(data.incident);
      } else if (finalStatus === "NEEDS_INFORMATION") {
        setAiStatus("NEEDS_INFORMATION");
        setAiResult(data.incident);
      } else {
        setAiStatus(finalStatus || "READY");
        setAiResult(data.incident);
      }
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setAiError("");
    setAiResult(null);
    setAiStatus(null);
    setSubmittedIncident(null);

    if (!clientId) {
      setError("Please select a client.");
      return;
    }
    if (!propertyId) {
      setError("Please select a property.");
      return;
    }
    if (!description.trim() || !location.trim()) {
      setError("Please enter the complaint and location.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          location,
          clientId,
          propertyId,
          assetId: assetId || null,
          reporterName: reporterName || null,
          reporterEmail: reporterEmail || null,
          reporterPhone: reporterPhone || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create complaint");
      const incident = data.incident;
      setSubmittedIncident(incident);
      setMessage(`Complaint submitted successfully.`);
      // Do not clear form fully yet; keep for reference but clear description optionally
      // Trigger AI analysis automatically (database-first: incident already saved)
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
    setMessage("");
    setError("");
    setDescription("");
    setReporterName("");
    setReporterEmail("");
    setReporterPhone("");
    setAssetId("");
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
      <Link href="/" className="text-sm text-slate-400 hover:text-white">
        ← Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">New Maintenance Complaint</h1>
        <p className="mt-1 text-sm text-slate-400">Complaint must be linked to a verified client and property. Asset is optional but validated server-side.</p>
      </div>

      {!submittedIncident ? (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Step 1: Select Client *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600"
            >
              <option value="">Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.companyName ? `· ${c.companyName}` : ""} {c.status === "INACTIVE" ? "(INACTIVE)" : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Only ACTIVE clients can submit complaints. Server validates client status.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Step 2: Select Property *</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              disabled={!clientId}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600 disabled:opacity-50"
            >
              <option value="">{!clientId ? "Select client first" : "Select a property"}</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.propertyCode}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Only properties belonging to the selected client are shown. Cross-client access is rejected server-side.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Step 3: Select Asset <span className="text-slate-500">(optional)</span>
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              disabled={!propertyId}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600 disabled:opacity-50"
            >
              <option value="">{!propertyId ? "Select property first" : "No asset (general complaint)"}</option>
              {filteredAssets.map((a) => (
                <option key={a.id} value={a.assetCode}>
                  {a.assetCode} · {a.name} · {a.category}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Only assets belonging to the selected property are listed. Cross-property assets are rejected.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Step 4: Describe Problem *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: The AC in room 401 is not cooling and water is leaking."
              rows={5}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Location *</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Example: Block B, Floor 4, Room 401"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-600"
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm font-medium text-slate-300">Step 5: Reporter Information <span className="text-slate-500">(optional)</span></p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Name</label>
                <input
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Tenant Name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-slate-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Email</label>
                <input
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="tenant@example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-slate-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Phone</label>
                <input
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-slate-600"
                />
              </div>
            </div>
          </div>

          {error && <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50 shadow-[0_3px_0_0_rgb(15_23_42)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Complaint submitted */}
          <Reveal>
            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-sm">✓</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-300">Complaint submitted</p>
                  <p className="mt-1 text-sm text-slate-300">Incident #{submittedIncident.id.slice(0, 8)} · {submittedIncident.id}</p>
                  <p className="text-xs text-slate-500">{submittedIncident.description.slice(0, 80)}</p>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/incidents/${submittedIncident.id}`} className="rounded-lg border border-emerald-900 bg-emerald-950 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/50">
                      View Incident Detail →
                    </Link>
                    <button onClick={resetForm} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
                      New Complaint
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* AI Analyzing */}
          {aiStatus === "ANALYZING" && (
            <Reveal>
              <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-6">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
                  </span>
                  <p className="text-sm font-medium text-amber-300">AI is analyzing your complaint...</p>
                </div>
                <p className="mt-2 text-xs text-slate-500">Analyzing category, severity, confidence and recommended action. Incident is safely stored as ANALYZING.</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-amber-600 to-amber-400 opacity-60"></div>
                </div>
              </div>
            </Reveal>
          )}

          {/* AI Error */}
          {aiStatus === "ERROR" && (
            <Reveal>
              <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
                <p className="text-sm font-semibold text-red-300">AI analysis temporarily unavailable.</p>
                <p className="mt-1 text-xs text-slate-400">Complaint saved, but AI analysis is temporarily unavailable.</p>
                <p className="mt-1 text-xs text-red-300">{aiError}</p>
                <p className="mt-1 text-xs text-slate-500">Incident #{submittedIncident.id.slice(0, 8)} remains in database as ANALYZING.</p>
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-200 disabled:opacity-50 shadow-[0_3px_0_0_rgb(15_23_42)]"
                >
                  {retrying ? "Retrying..." : "Retry AI Analysis"}
                </button>
              </div>
            </Reveal>
          )}

          {/* READY */}
          {aiStatus === "READY" && aiResult && (
            <Reveal>
              <div className="rounded-xl border border-emerald-900/50 bg-slate-900 p-6 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">✓</span>
                  <p className="text-sm font-semibold text-emerald-300">AI Analysis Complete</p>
                  <span className="ml-auto rounded-full border border-emerald-900 bg-emerald-950 px-2 py-0.5 text-xs text-emerald-300">READY</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="font-medium text-white">{aiResult.category}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <p className="text-xs text-slate-500">Severity</p>
                    <p className="font-medium text-white">{aiResult.severity}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <p className="text-xs text-slate-500">Confidence</p>
                    <p className="font-medium text-white">{aiResult.confidence ? `${Math.round(aiResult.confidence * 100)}%` : "—"}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <p className="text-xs text-slate-500">Issue</p>
                    <p className="font-medium text-white">{aiResult.issue || "—"}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Recommended action</p>
                  <p className="mt-1 text-sm text-white">{aiResult.recommendedAction || "—"}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/incidents/${submittedIncident.id}`} className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-200 shadow-[0_3px_0_0_rgb(15_23_42)]">
                    View Incident Detail
                  </Link>
                  <Link href={`/incidents/${submittedIncident.id}`} className="rounded-lg border border-emerald-900 bg-emerald-950 px-4 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-900/50">
                    Create Work Order
                  </Link>
                  <button onClick={resetForm} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800">
                    Submit Another
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">Status: READY — ready for work order (deterministic rules apply).</p>
              </div>
            </Reveal>
          )}

          {/* NEEDS_INFORMATION */}
          {aiStatus === "NEEDS_INFORMATION" && aiResult && (
            <Reveal>
              <div className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs">⚠</span>
                  <p className="text-sm font-semibold text-amber-300">More Information Required</p>
                  <span className="ml-auto rounded-full border border-amber-900 bg-amber-950 px-2 py-0.5 text-xs text-amber-300">NEEDS_INFORMATION</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="font-medium text-white">{aiResult.category}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <p className="text-xs text-slate-500">Confidence</p>
                    <p className="font-medium text-white">{aiResult.confidence ? `${Math.round(aiResult.confidence * 100)}%` : "—"}</p>
                  </div>
                </div>
                {missingInfo.length > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-900/50 bg-slate-950 p-3">
                    <p className="text-xs font-medium text-amber-300">Missing information:</p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-slate-300">
                      {missingInfo.map((m, i) => (
                        <li key={i} className="text-xs">{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiResult.recommendedAction && (
                  <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <p className="text-xs text-slate-500">Recommended action (if available)</p>
                    <p className="mt-1 text-sm text-white">{aiResult.recommendedAction}</p>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Link href={`/incidents/${submittedIncident.id}`} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800">
                    View Incident Detail
                  </Link>
                  <button onClick={resetForm} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800">
                    Submit Another
                  </button>
                </div>
                <p className="mt-2 text-xs text-amber-400">More information is required before a work order can be created.</p>
              </div>
            </Reveal>
          )}

          {error && <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
          {message && aiStatus === null && <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3 text-sm text-emerald-300">{message}</div>}
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
