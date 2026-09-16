import "./globals.css";

export const metadata = {
  title: "WorkOrder Intelligence",
  description: "AI-powered maintenance triage and worker dispatch",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
