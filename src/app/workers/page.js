"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useEffect, useState } from "react";

function StatusBadge({ status }) {
  const map = {
    AVAILABLE: "border-emerald-900 bg-emerald-950 text-emerald-300",
    BUSY: "border-amber-900 bg-amber-950 text-amber-300",
    OFFLINE: "border-slate-700 bg-slate-800 text-slate-300",
  };
  const cls = map[status] || "border-slate-700 bg-slate-800 text-slate-300";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [counts, setCounts] = useState({ available: 0, busy: 0, offline: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");

  async function loadWorkers() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/workers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load workers");
      setWorkers(data.workers || []);
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkers();
  }, []);

  const filtered = filter === "ALL" ? workers : workers.filter((w) => w.status === filter);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-slate-400 hover:text-white">
              ← Back to Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Workers</h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage maintenance workers and availability
            </p>
          </div>
          <Link
            href="/workers/new"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
          >
            + Add Worker
          </Link>
        </div>

        {/* Summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Workers</p>
            <p className="mt-2 text-3xl font-bold">{counts.total}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Available</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">{counts.available}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Busy</p>
            <p className="mt-2 text-3xl font-bold text-amber-400">{counts.busy}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Offline</p>
            <p className="mt-2 text-3xl font-bold text-slate-300">{counts.offline}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-6 flex items-center gap-2">
          <span className="text-xs text-slate-500">Filter:</span>
          {["ALL", "AVAILABLE", "BUSY", "OFFLINE"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                filter === s
                  ? "border-white bg-white text-slate-900"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <p className="text-sm text-slate-400">Loading workers...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">
            <p className="text-sm text-slate-400">No workers found.</p>
            <Link
              href="/workers/new"
              className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
            >
              Add first worker
            </Link>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/50 text-xs text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Skills</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Availability</th>
                    <th className="px-4 py-3 font-medium text-center">Assigned</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-medium text-white">{w.name}</td>
                      <td className="px-4 py-3 text-slate-400">{w.skills}</td>
                      <td className="px-4 py-3 text-slate-400">{w.location}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={w.status} />
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300">{w.workOrderCount}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/workers/${w.id}`}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile cards fallback - hidden on desktop but visible if needed */}
        <div className="mt-6 grid gap-3 sm:hidden">
          {!loading &&
            !error &&
            filtered.map((w) => (
              <div key={`card-${w.id}`} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{w.name}</p>
                    <p className="text-xs text-slate-400">{w.location} · {w.skills}</p>
                  </div>
                  <StatusBadge status={w.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{w.workOrderCount} assigned</span>
                  <Link href={`/workers/${w.id}`} className="text-slate-300 hover:text-white">
                    View →
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
