"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewClientPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Name, email and phone are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), companyName: companyName.trim() || null, email: email.trim(), phone: phone.trim(), status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create client");
      router.push(`/clients/${data.client.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/clients" className="text-sm text-slate-400 hover:text-white">← Back to Clients</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Add Client</h1>
        <p className="text-sm text-slate-400">Create a property owner · ACTIVE clients can submit complaints</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="DivyaSree Facilities" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Company <span className="text-slate-500">(optional)</span></label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="DivyaSree Group" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email *</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="facilities@example.com" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Phone *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600" />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600">
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
        {error && <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50 shadow-[0_3px_0_0_rgb(15_23_42)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
          {loading ? "Creating..." : "Create Client"}
        </button>
      </form>
    </div>
  );
}
