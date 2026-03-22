import { Outlet } from "react-router-dom";
import ScannerSidebar from "../components/ScannerSidebar.jsx";
import SiteFooter from "../components/layout/SiteFooter.jsx";

export default function ScannerDashboardLayout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-slate-300 font-sans antialiased selection:bg-primary/30 selection:text-white">
      {/* Dynamic ambient background */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[40vw] w-[40vw] rounded-full bg-primary/[0.04] opacity-50 blur-[100px] mix-blend-screen" />
        <div className="absolute h-[60vw] w-[60vw] rounded-full bg-blue-900/[0.03] opacity-40 blur-[120px] mix-blend-screen" />
      </div>
      <div
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
        <ScannerSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
          <SiteFooter variant="minimal" />
        </div>
      </div>
    </div>
  );
}
