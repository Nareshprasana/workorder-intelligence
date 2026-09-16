import Reveal from "../../components/dashboard/Reveal";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-sm text-slate-400">System configuration · Demo mode</p>
        </div>
      </Reveal>
      <Reveal>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-white">Operations Center</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-800 py-2"><span className="text-slate-400">AI Engine</span><span className="flex items-center gap-2 text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>Online</span></div>
            <div className="flex justify-between border-b border-slate-800 py-2"><span className="text-slate-400">Model</span><span className="text-slate-300">gemini-3.6-flash</span></div>
            <div className="flex justify-between border-b border-slate-800 py-2"><span className="text-slate-400">Deterministic Rules</span><span className="text-slate-300">Enabled</span></div>
            <div className="flex justify-between py-2"><span className="text-slate-400">Database</span><span className="text-slate-300">SQLite + Prisma 7</span></div>
          </div>
          <p className="mt-4 text-xs text-slate-500">Portfolio prototype · No auth · No external infra · AI understands, rules decide.</p>
        </div>
      </Reveal>
    </div>
  );
}
