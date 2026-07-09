import React, { useState } from "react";
import { Menu, Globe } from "lucide-react";
import AuthGate from "./components/AuthGate";
import Sidebar from "./components/Sidebar";
import { CurrencyProvider } from "./components/CurrencyContext";
import { PropertiesProvider, useProperties } from "./components/PropertiesContext";
import { DateRangeProvider } from "./components/DateRangeContext";
import { RatesProvider } from "./components/RatesContext";
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
import Footer from "./components/Footer";

function DashboardInner({ profile, onLogout }) {
  const [active, setActive] = useState("dashboard");
  const [propertyId, setPropertyId] = useState("dhavara-vientiane");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("ratepulse_sidebar_collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { allProperties } = useProperties();

  function handleSetCollapsed(value) {
    setCollapsed(value);
    localStorage.setItem("ratepulse_sidebar_collapsed", String(value));
  }

  const currentProperty = allProperties.find((p) => p.id === propertyId) || allProperties[0];
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
    <CurrencyProvider defaultCurrency={currentProperty?.currency || "INR"}>
      <DateRangeProvider>
        <RatesProvider propertyId={propertyId}>
          <div className="flex min-h-screen bg-cream font-body">
            <Sidebar
              active={active}
              setActive={setActive}
              onLogout={onLogout}
              isAdmin={profile.is_admin}
              collapsed={collapsed}
              setCollapsed={handleSetCollapsed}
              mobileOpen={mobileOpen}
              setMobileOpen={setMobileOpen}
            />
            <div className="flex-1 overflow-auto flex flex-col min-w-0">
              {/* Mobile-only top bar with hamburger */}
              <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-20">
                <button onClick={() => setMobileOpen(true)} className="text-navy">
                  <Menu size={22} />
                </button>
                <Globe className="text-navy w-6 h-6 shrink-0" />
                <span className="font-heading font-semibold text-navy text-sm">CRSRatePulse</span>
              </div>

              <div className="flex-1 p-4 sm:p-6 md:p-8">{pages[active]}</div>
              <Footer />
            </div>
          </div>
        </RatesProvider>
      </DateRangeProvider>
    </CurrencyProvider>
  );
}

function Dashboard({ profile, onLogout }) {
  return (
    <PropertiesProvider>
      <DashboardInner profile={profile} onLogout={onLogout} />
    </PropertiesProvider>
  );
}

export default function App() {
  return <AuthGate>{(profile, signOut) => <Dashboard profile={profile} onLogout={signOut} />}</AuthGate>;
}
