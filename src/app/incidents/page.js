"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import Link from "next/link";
import { useEffect, useState } from "react";
import Reveal from "../../components/dashboard/Reveal";

// NEEDS_INFORMATION kept in backend filter for backward compat but not shown as primary workflow — new flow is NEW→ANALYZING→READY (non-blocking)
const statuses = ["ALL","NEW","ANALYZING","READY","ASSIGNED","IN_PROGRESS","COMPLETED","REJECTED"];
const severities = ["ALL","LOW","MEDIUM","HIGH","CRITICAL"];
const categories = ["ALL","HVAC","ELECTRICAL","PLUMBING","LIFT","GENERAL"];

function Badge({ children, tone = "slate" }) {
  const map = {
    slate: "border-slate-700 bg-slate-800 text-slate-300",
    amber: "border-amber-900 bg-amber-950 text-amber-300",
    emerald: "border-emerald-900 bg-emerald-950 text-emerald-300",
    blue: "border-sky-900 bg-sky-950 text-sky-300",
    red: "border-red-900 bg-red-950 text-red-300",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>;
}

function StatusCell({ status }) {
  if (status === "ANALYZING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-900 bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
        </span>
        ANALYZING
      </span>
    );
  }
  if (status === "NEEDS_INFORMATION") {
    // Legacy status — kept for backward compat, rendered as non-blocking READY (missing info stored in aiAnalysis, worker will investigate on site)
    return <span className="rounded-full border border-emerald-900 bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-300">READY ✓ <span className="opacity-60">(legacy)</span></span>;
  }
  if (status === "READY") {
    return <span className="rounded-full border border-emerald-900 bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-300">READY ✓</span>;
  }
  if (status === "NEW") return <Badge>NEW</Badge>;
  return <Badge tone={status === "COMPLETED" ? "emerald" : status === "ASSIGNED" || status === "IN_PROGRESS" ? "blue" : "slate"}>{status}</Badge>;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  async function load(targetPage = page) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(targetPage), limit: "10" });
    if (status !== "ALL") params.set("status", status);
    if (severity !== "ALL") params.set("severity", severity);
    if (category !== "ALL") params.set("category", category);
    const res = await fetch(`/api/incidents?${params}`);
    const data = await res.json();
    if (res.ok) {
      setIncidents(data.incidents);
      setPagination(data.pagination);
    }
    setLoading(false);
  }

  useEffect(() => {
    load(1);
    setPage(1);
  }, [status, severity, category]);

  useEffect(() => {
    load(page);
  }, [page]);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Complaints</h1>
            <p className="text-sm text-slate-400">Resident complaints with AI triage → Work Requests</p>
          </div>
          <Link href="/complaints/new" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-[0_3px_0_0_rgb(15_23_42)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
            + New Complaint
          </Link>
        </div>
      </Reveal>

      <Reveal>
        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
            {severities.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="ml-auto text-xs text-slate-500">{pagination.total} total · Page {pagination.page} of {pagination.totalPages}</span>
        </div>
      </Reveal>

      <Reveal>
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Incident</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">Loading...</td></tr>
                ) : incidents.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No incidents found.</td></tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="max-w-xs px-4 py-3">
                        <Link href={`/complaints/${inc.id}`} className="block hover:opacity-80">
                          <p className="truncate font-medium text-white hover:text-sky-300">{inc.description}</p>
                          <p className="truncate text-xs text-slate-500">{inc.resident ? `${inc.resident.name} · ${inc.resident.building}, ${inc.resident.apartment}` : inc.reporterName ? `Reporter: ${inc.reporterName}` : "No resident"}</p>
                          <p className="truncate text-xs text-slate-500">{inc.issue || "—"}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{inc.category || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{inc.location}</td>
                      <td className="px-4 py-3">{inc.severity ? <Badge tone={inc.severity === "CRITICAL" ? "red" : inc.severity === "HIGH" ? "red" : inc.severity === "MEDIUM" ? "amber" : "slate"}>{inc.severity}</Badge> : <span className="text-xs text-slate-600">—</span>}</td>
                      <td className="px-4 py-3"><StatusCell status={inc.status} /></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(inc.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-40">Previous</button>
            <span className="text-xs text-slate-500">Page {pagination.page} of {pagination.totalPages}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-40">Next</button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
