"use client";

import Link from "next/link";
import { useState } from "react";

export default function NewComplaintPage() {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [assetId, setAssetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!description.trim() || !location.trim()) {
      setMessage("Please enter the complaint and location.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          location,
          assetId: assetId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create complaint");
      }

      setMessage("Complaint submitted successfully.");

      setDescription("");
      setLocation("");
      setAssetId("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-6 text-3xl font-bold">
            New Maintenance Complaint
          </h1>

          <p className="mt-2 text-slate-400">
            Describe the maintenance problem. AI will analyze it
            after submission.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Complaint
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: The AC in room 401 is not cooling."
              rows={5}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Location
            </label>

            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Example: Block B, Floor 4, Room 401"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Asset ID{" "}
              <span className="text-slate-500">(optional)</span>
            </label>

            <input
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              placeholder="Example: AC-B4-401"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-slate-500"
            />
          </div>

          {message && (
            <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-3 font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      </div>
    </main>
  );
}