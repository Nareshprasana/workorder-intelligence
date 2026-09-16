"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewPropertyPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [name, setName] = useState("");
  const [propertyCode, setPropertyCode] = useState("");
  const [address, setAddress] = useState("");
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClients() {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (res.ok) {
        const active = (data.clients || []).filter((c) => c.status === "ACTIVE");
        setClients(active);
        if (active.length > 0) setClientId(active[0].id);
      }
    }
    loadClients();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !propertyCode.trim() || !address.trim() || !clientId) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), propertyCode: propertyCode.trim(), address: address.trim(), clientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create property");
      router.push(`/properties/${data.property.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/properties" className="text-sm text-slate-400 hover:text-white">← Back to Properties</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Add Property</h1>
        <p className="text-sm text-slate-400">Link property to an ACTIVE client · Property code is an identifier, not authentication</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Property Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="DivyaSree Block D" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Property Code * <span className="text-xs text-slate-500">(unique, e.g. PROP-BLOCK-D-001)</span></label>
          <input value={propertyCode} onChange={(e) => setPropertyCode(e.target.value)} placeholder="PROP-BLOCK-D-001" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-mono text-white outline-none focus:border-slate-600" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Address *</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="DivyaSree Campus, Block D, Bangalore" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Client *</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600">
            {clients.length === 0 && <option value="">No active clients</option>}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.companyName ? `· ${c.companyName}` : ""}</option>
            ))}
          </select>
          {clients.length === 0 && <p className="mt-1 text-xs text-amber-400">Create an ACTIVE client first.</p>}
        </div>
        {error && <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50 shadow-[0_3px_0_0_rgb(15_23_42)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
          {loading ? "Creating..." : "Create Property"}
        </button>
      </form>
    </div>
  );
}
