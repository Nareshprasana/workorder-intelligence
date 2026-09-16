"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
  }, [clientId]);

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
  }, [propertyId]);

  const filteredAssets = propertyId ? assets.filter((a) => !a.propertyId || a.propertyId === propertyId) : [];

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

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
      setMessage(`Complaint submitted successfully. Incident ID: ${data.incident.id}`);
      setDescription("");
      setReporterName("");
      setReporterEmail("");
      setReporterPhone("");
      setAssetId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        {message && <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3 text-sm text-emerald-300">{message}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50 shadow-[0_3px_0_0_rgb(15_23_42)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          {loading ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
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
