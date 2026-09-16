import "./globals.css";
import DashboardShell from "../components/dashboard/DashboardShell";

export const metadata = {
  title: "WorkOrder Intelligence",
  description: "AI-powered maintenance triage and worker dispatch",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans bg-slate-950">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
