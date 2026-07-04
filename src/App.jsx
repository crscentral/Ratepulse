import React, { useState } from "react";
import AuthGate from "./components/AuthGate";
import Sidebar from "./components/Sidebar";
import { CurrencyProvider } from "./components/CurrencyContext";
import DashboardPage from "./pages/Dashboard";
import ComparisonPage from "./pages/Comparison";
import ParityPage from "./pages/Parity";
import HeatmapPage from "./pages/Heatmap";
import RecommendationsPage from "./pages/Recommendations";
import AlertsPage from "./pages/Alerts";
import PropertiesPage from "./pages/Properties";
import ExportPage from "./pages/Export";
import SettingsPage from "./pages/Settings";
import AdminApprovals from "./components/AdminApprovals";
import { PROPERTIES } from "./lib/seedData";

function Dashboard({ profile, onLogout }) {
  const [active, setActive] = useState("dashboard");
  const [propertyId, setPropertyId] = useState("dhavara");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("ratepulse_sidebar_collapsed") === "true");

  function handleSetCollapsed(value) {
    setCollapsed(value);
    localStorage.setItem("ratepulse_sidebar_collapsed", String(value));
  }

  const currentProperty = PROPERTIES.find((p) => p.id === propertyId);
  const pageProps = { propertyId, setPropertyId };
  const pages = {
    dashboard: <DashboardPage {...pageProps} />,
    comparison: <ComparisonPage {...pageProps} />,
    parity: <ParityPage {...pageProps} />,
    heatmap: <HeatmapPage {...pageProps} />,
    recommendations: <RecommendationsPage {...pageProps} />,
    alerts: <AlertsPage {...pageProps} />,
    properties: <PropertiesPage {...pageProps} />,
    export: <ExportPage {...pageProps} />,
    settings: <SettingsPage profile={profile} />,
    admin: <AdminApprovals />,
  };

  return (
    <CurrencyProvider defaultCurrency={currentProperty.currency}>
      <div className="flex min-h-screen bg-cream font-body">
        <Sidebar
          active={active}
          setActive={setActive}
          onLogout={onLogout}
          isAdmin={profile.is_admin}
          collapsed={collapsed}
          setCollapsed={handleSetCollapsed}
        />
        <div className="flex-1 p-8 overflow-auto">{pages[active]}</div>
      </div>
    </CurrencyProvider>
  );
}

export default function App() {
  return <AuthGate>{(profile, signOut) => <Dashboard profile={profile} onLogout={signOut} />}</AuthGate>;
}
