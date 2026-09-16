"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const VALID_STATUSES = ["AVAILABLE", "BUSY", "OFFLINE"];

export default function NewWorkerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Worker name is required.");
      return;
    }
    if (!skills.trim()) {
      setError("At least one skill is required.");
      return;
    }
    if (!location.trim()) {
      setError("Location is required.");
      return;
    }
    if (!VALID_STATUSES.includes(status)) {
      setError("Invalid availability status.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          location: location.trim(),
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create worker");
      router.push("/workers");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/workers" className="text-sm text-slate-400 hover:text-white">
          ← Back to Workers
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">Add Worker</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create a new maintenance worker. Skills determine work-order eligibility.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Worker Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Priya Sharma"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Skills <span className="text-slate-500">(comma-separated)</span>
            </label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Example: HVAC, Electrical"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-500"
            />
            <p className="mt-1 text-xs text-slate-500">e.g. HVAC, Electrical, Plumbing, General Maintenance</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Example: Block A"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Availability</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="BUSY">BUSY</option>
              <option value="OFFLINE">OFFLINE</option>
            </select>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="rounded-full border border-emerald-900 bg-emerald-950 px-2 py-0.5 text-emerald-300">AVAILABLE green</span>
              <span className="rounded-full border border-amber-900 bg-amber-950 px-2 py-0.5 text-amber-300">BUSY yellow</span>
              <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-slate-300">OFFLINE gray</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Worker"}
          </button>
        </form>
      </div>
    </main>
  );
}
