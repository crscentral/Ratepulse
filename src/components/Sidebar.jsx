import React from "react";
import {
  LayoutDashboard, TrendingUp, ShieldCheck, Grid3x3, Lightbulb, Bell,
  Building2, Download, LogOut, ShieldAlert, Settings, ChevronsLeft, ChevronsRight, X, Globe
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "comparison", label: "Rate Comparison", icon: TrendingUp },
  { key: "parity", label: "Rate Parity", icon: ShieldCheck },
  { key: "heatmap", label: "Heatmap", icon: Grid3x3 },
  { key: "recommendations", label: "Recommendations", icon: Lightbulb },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "properties", label: "Properties", icon: Building2 },
  { key: "export", label: "Export", icon: Download },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ active, setActive, onLogout, isAdmin, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const items = isAdmin
    ? [...NAV_ITEMS, { key: "admin", label: "Admin Approvals", icon: ShieldAlert }]
    : NAV_ITEMS;

  function handleNavClick(key) {
    setActive(key);
    setMobileOpen(false); // auto-close the mobile drawer after picking a page
  }

  return (
    <>
      {/* Backdrop — mobile only, closes the drawer on tap */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div
        className={`fixed md:sticky top-0 left-0 h-screen z-40 flex flex-col text-white bg-navyDark transition-all duration-200 w-64 ${
          collapsed ? "md:w-16" : "md:w-60"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className={`px-5 py-6 flex items-center gap-2 border-b border-white/10 ${collapsed ? "md:justify-center md:px-0" : ""}`}>
          <Globe size={24} className="text-white shrink-0" />
          <span className={`text-lg font-semibold font-heading ${collapsed ? "md:hidden" : ""}`}>CRSRatePulse</span>
          <button onClick={() => setMobileOpen(false)} className="ml-auto md:hidden text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                  collapsed ? "md:justify-center md:px-0" : ""
                } ${isActive ? "bg-gold/15 text-gold font-semibold" : "text-white/75 hover:text-white/90"}`}
              >
                <Icon size={16} className="shrink-0" />
                <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full hidden md:flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/60 hover:text-white/90 transition ${collapsed ? "md:justify-center md:px-0" : ""}`}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            <span className={collapsed ? "md:hidden" : ""}>Collapse</span>
          </button>
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/60 hover:text-white/90 transition ${collapsed ? "md:justify-center md:px-0" : ""}`}
          >
            <LogOut size={16} className="shrink-0" />
            <span className={collapsed ? "md:hidden" : ""}>Sign out</span>
          </button>
        </div>
      </div>
    </>
  );
}
