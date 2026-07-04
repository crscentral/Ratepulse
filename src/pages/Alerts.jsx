import React, { useState } from "react";
import { Card, Badge, PageHeader } from "../components/ui";
import { seedAlerts } from "../lib/seedData";

export default function AlertsPage({ propertyId, setPropertyId }) {
  const [alerts, setAlerts] = useState(seedAlerts());
  return (
    <div>
      <PageHeader title="Alerts" subtitle="Parity breaches, competitor movement, and demand signals" propertyId={propertyId} setPropertyId={setPropertyId} />
      <Card className="divide-y divide-gray-100">
        {alerts.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-5 py-4" style={{ background: a.read ? "white" : "#FAFBFF" }}>
            <div className="flex items-center gap-4">
              <Badge tone={a.severity}>{a.severity}</Badge>
              <div>
                <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                  {a.title}
                  {!a.read && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                </div>
                <div className="text-xs text-gray-500">{a.detail}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">{a.time}</span>
              {!a.read && (
                <button
                  onClick={() => setAlerts(alerts.map((x) => (x.id === a.id ? { ...x, read: true } : x)))}
                  className="text-xs font-medium underline text-navy"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
