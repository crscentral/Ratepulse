import React, { useMemo } from "react";
import { TrendingUp, ShieldCheck, Bell, Building2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, KPICard, Badge, PageHeader } from "../components/ui";
import { PROPERTIES, COMPETITORS_BY_PROPERTY, seedRateHistory, seedParityViolations, seedAlerts } from "../lib/seedData";

export default function DashboardPage({ propertyId, setPropertyId }) {
  const history = useMemo(() => seedRateHistory(propertyId), [propertyId]);
  const violations = useMemo(() => seedParityViolations(propertyId), [propertyId]);
  const alerts = useMemo(() => seedAlerts(), [propertyId]);
  const highViolations = violations.filter((v) => v.severity === "high").length;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live overview of rate position and revenue signals" propertyId={propertyId} setPropertyId={setPropertyId} />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard label="Avg. Rate Position" value="+4.2%" delta="vs. competitor avg" deltaTone="up" icon={TrendingUp} />
        <KPICard label="Parity Violations" value={highViolations} delta="requires attention" deltaTone="down" icon={ShieldCheck} />
        <KPICard label="Active Alerts" value={alerts.filter((a) => !a.read).length} delta="unread" deltaTone="neutral" icon={Bell} />
        <KPICard label="Properties Tracked" value={PROPERTIES.length} delta={`${COMPETITORS_BY_PROPERTY[propertyId].length} competitors set`} deltaTone="neutral" icon={Building2} />
      </div>

      <Card className="p-5 mb-6">
        <h3 className="text-sm font-semibold mb-4 text-navy">Rate Trend — Your Property vs. Competitor Average (14 days)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#999" />
            <YAxis tick={{ fontSize: 11 }} stroke="#999" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="yourRate" name="Your Rate" stroke="#1B3A6B" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="compAvg" name="Competitor Avg" stroke="#C9A84C" strokeWidth={2.5} dot={false} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4 text-navy">Recent Alerts</h3>
        <div className="divide-y divide-gray-100">
          {alerts.slice(0, 4).map((a) => (
            <div key={a.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Badge tone={a.severity}>{a.severity}</Badge>
                <div>
                  <div className="text-sm font-medium text-gray-800">{a.title}</div>
                  <div className="text-xs text-gray-500">{a.detail}</div>
                </div>
              </div>
              <span className="text-xs text-gray-400">{a.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
