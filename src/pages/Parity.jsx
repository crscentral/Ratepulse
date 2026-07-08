import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, Calendar } from "lucide-react";
import { Card, KPICard, Badge, PageHeader } from "../components/ui";
import { seedParityViolations } from "../lib/seedData";
import { useCompetitors } from "../lib/useCompetitors";
import { useProperties } from "../components/PropertiesContext";
import { useLiveParity } from "../lib/liveRates";
import { useDateRange, formatDateRange } from "../components/DateRangeContext";

export default function ParityPage({ propertyId, setPropertyId }) {
  const { allProperties } = useProperties();
  const { competitors, loading } = useCompetitors(propertyId);
  const property = allProperties.find((p) => p.id === propertyId);
  const { checkIn, checkOut } = useDateRange();
  const mockViolations = useMemo(() => seedParityViolations(propertyId, competitors), [propertyId, competitors]);

  const { live, channels, referenceRate, loading: refreshing, refresh } = useLiveParity({
    hotelName: property?.name,
    city: property?.location,
    checkIn,
    checkOut,
    fallback: null,
  });

  if (loading) return null;

  // Live channels (real data) take a different shape than the mock violations,
  // so render them separately when available rather than forcing one schema.
  const violations = live && channels
    ? channels.map((c) => ({
        channel: c.channel,
        room: "Overall lowest rate",
        yourDirect: referenceRate,
        otaRate: c.rate,
        diffPct: c.diffPct,
        severity: c.severity,
      }))
    : mockViolations;

  return (
    <div>
      <PageHeader title="Rate Parity" subtitle="OTA rates vs. your reference rate — flagged violations" propertyId={propertyId} setPropertyId={setPropertyId} />

      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
        <Calendar size={13} className="text-gray-400" />
        Checking rates for {formatDateRange(checkIn, checkOut)} <span className="text-gray-400">(set on Rate Comparison)</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 sm:mr-4">
          <KPICard label="High Severity" value={violations.filter((v) => v.severity === "high").length} icon={AlertTriangle} deltaTone="down" delta="undercutting reference rate" />
          <KPICard label="Medium Severity" value={violations.filter((v) => v.severity === "medium").length} icon={AlertTriangle} deltaTone="neutral" delta="monitor closely" />
          <KPICard label="At Parity" value={violations.filter((v) => v.severity === "ok").length} icon={CheckCircle2} deltaTone="up" delta="no action needed" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mb-3">
        <span className="text-xs text-gray-400">{live ? "Showing live rates" : "Sample data"}</span>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh rates"}
        </button>
      </div>

      {live && (
        <p className="text-xs text-gray-400 mb-3">
          Reference = overall lowest listed rate for this hotel right now (₹{referenceRate?.toLocaleString()}) — Google Hotels doesn't reliably label a single "official direct" price, so this is the closest available baseline, not a guaranteed direct-website rate.
        </p>
      )}

      <Card className="divide-y divide-gray-100">
        {violations.map((v, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-4">
              <Badge tone={v.severity}>{v.severity === "ok" ? "at parity" : `${v.severity} risk`}</Badge>
              <div>
                <div className="text-sm font-medium text-gray-800">{v.channel} — {v.room}</div>
                <div className="text-xs text-gray-500">Reference: ₹{v.yourDirect?.toLocaleString()} · Channel: ₹{v.otaRate?.toLocaleString()}</div>
              </div>
            </div>
            <div className={`text-sm font-semibold ${v.diffPct < 0 ? "text-red-600" : "text-emerald-600"}`}>
              {v.diffPct === 0 ? "0%" : `${v.diffPct}%`}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
