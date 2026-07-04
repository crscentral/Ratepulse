import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, KPICard, Badge, PageHeader } from "../components/ui";
import { seedParityViolations } from "../lib/seedData";

export default function ParityPage({ propertyId, setPropertyId }) {
  const violations = useMemo(() => seedParityViolations(propertyId), [propertyId]);
  return (
    <div>
      <PageHeader title="Rate Parity" subtitle="OTA rates vs. your direct channel — flagged violations" propertyId={propertyId} setPropertyId={setPropertyId} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <KPICard label="High Severity" value={violations.filter((v) => v.severity === "high").length} icon={AlertTriangle} deltaTone="down" delta="undercutting direct rate" />
        <KPICard label="Medium Severity" value={violations.filter((v) => v.severity === "medium").length} icon={AlertTriangle} deltaTone="neutral" delta="monitor closely" />
        <KPICard label="At Parity" value={violations.filter((v) => v.severity === "ok").length} icon={CheckCircle2} deltaTone="up" delta="no action needed" />
      </div>

      <Card className="divide-y divide-gray-100">
        {violations.map((v, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-4">
              <Badge tone={v.severity}>{v.severity === "ok" ? "at parity" : `${v.severity} risk`}</Badge>
              <div>
                <div className="text-sm font-medium text-gray-800">{v.channel} — {v.room}</div>
                <div className="text-xs text-gray-500">Direct: ₹{v.yourDirect.toLocaleString()} · OTA: ₹{v.otaRate.toLocaleString()}</div>
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
