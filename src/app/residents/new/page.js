"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewResidentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [apartment, setApartment] = useState("");
  const [building, setBuilding] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !apartment.trim() || !building.trim()) {
      setError("Name, apartment and building are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, apartment, building, email: email || null, phone: phone || null, status: "ACTIVE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/residents");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/residents" className="text-sm text-slate-400 hover:text-white">← Back to Residents</Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Add Resident</h1>
        <p className="text-sm text-slate-400">Simple resident database for complaint workflow</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ravi Kumar" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Apartment/Room/Unit *</label>
            <input value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder="B-401" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Building/Block *</label>
            <input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="Block B" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ravi@example.com" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-600" />
          </div>
        </div>
        {error && <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50 shadow-[0_3px_0_0_rgb(15_23_42)]">{loading ? "Creating..." : "Add Resident"}</button>
      </form>
    </div>
  );
}
