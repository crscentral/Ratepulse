import React from "react";
import {
  LayoutDashboard, TrendingUp, ShieldCheck, Grid3x3, Lightbulb, Bell,
  Building2, Download, LogOut, ShieldAlert, Settings, ChevronsLeft, ChevronsRight
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

export default function Sidebar({ active, setActive, onLogout, isAdmin, collapsed, setCollapsed }) {
  const items = isAdmin
    ? [...NAV_ITEMS, { key: "admin", label: "Admin Approvals", icon: ShieldAlert }]
    : NAV_ITEMS;

  return (
    <div className={`shrink-0 h-screen sticky top-0 flex flex-col text-white bg-navyDark transition-all duration-200 ${collapsed ? "w-16" : "w-60"}`}>
      <div className={`px-5 py-6 flex items-center gap-2 border-b border-white/10 ${collapsed ? "justify-center px-0" : ""}`}>
        <div className="w-8 h-8 rounded-md flex items-center justify-center bg-navy shrink-0">
          <TrendingUp size={16} className="text-gold" />
        </div>
        {!collapsed && <span className="text-lg font-semibold font-heading">RatePulse</span>}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                collapsed ? "justify-center px-0" : ""
              } ${isActive ? "bg-gold/15 text-gold font-semibold" : "text-white/75 hover:text-white/90"}`}
            >
              <Icon size={16} />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/60 hover:text-white/90 transition ${collapsed ? "justify-center px-0" : ""}`}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!collapsed && "Collapse"}
        </button>
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/60 hover:text-white/90 transition ${collapsed ? "justify-center px-0" : ""}`}
        >
          <LogOut size={16} />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );
}
