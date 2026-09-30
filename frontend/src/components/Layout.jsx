import { NavLink } from "react-router-dom";
import { LighthouseLogo } from "./Brand";
import { LayoutDashboard, FileText, CalendarClock, Receipt, Database } from "lucide-react";

const tabs = [
  { to: "/", label: "Ringkasan", icon: LayoutDashboard, testid: "nav-tab-dashboard", end: true },
  { to: "/invoices", label: "Invoice & SPP", icon: FileText, testid: "nav-tab-invoices" },
  { to: "/schedules", label: "Jadwal Cicilan", icon: CalendarClock, testid: "nav-tab-schedules" },
  { to: "/receipts", label: "Tanda Terima", icon: Receipt, testid: "nav-tab-receipts" },
  { to: "/master-data", label: "Master Program", icon: Database, testid: "nav-tab-master-data" },
];

export const Layout = ({ children }) => (
  <div className="min-h-screen bg-[#f8fafc]">
    <header className="no-print sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-slate-200/80">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 rounded-xl p-1.5 border border-blue-100">
            <LighthouseLogo className="w-8 h-8" />
          </div>
          <div className="leading-tight">
            <div className="font-heading font-extrabold text-blue-900 text-sm sm:text-base tracking-tight">
              Mercusuar Harapan Mulia
            </div>
            <div className="text-[11px] text-slate-500 hidden sm:block">BSD, Tangerang Selatan • TA 2026/2027</div>
          </div>
        </div>
        <nav className="flex items-center gap-1 ml-auto overflow-x-auto">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              data-testid={t.testid}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive ? "bg-blue-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden md:inline">{t.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
    <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6">{children}</main>
  </div>
);
