import React, { useState } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { useCurrency, CURRENCIES } from "./CurrencyContext";
import { useProperties } from "./PropertiesContext";

export function Badge({ tone = "neutral", children }) {
  const tones = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-blue-50 text-blue-700 border-blue-200",
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
    gold: "bg-[#F7EFD9] text-[#8a6f2a] border-[#e6d8ad]",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>;
}

export function KPICard({ label, value, delta, deltaTone, icon: Icon }) {
  return (
    <Card className="p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
        <Icon size={16} className="text-gold" />
      </div>
      <div className="text-2xl font-semibold font-heading text-navy">{value}</div>
      {delta && (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            deltaTone === "up" ? "text-emerald-600" : deltaTone === "down" ? "text-red-600" : "text-gray-500"
          }`}
        >
          {delta}
        </div>
      )}
    </Card>
  );
}

export function PropertySwitcher({ propertyId, setPropertyId }) {
  const [open, setOpen] = useState(false);
  const { allProperties } = useProperties();
  const current = allProperties.find((p) => p.id === propertyId) || allProperties[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-sm bg-white hover:bg-gray-50"
      >
        <Building2 size={14} className="text-navy" />
        <span className="font-medium text-navy">{current?.name}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 overflow-hidden max-h-80 overflow-y-auto">
          {allProperties.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPropertyId(p.id);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex flex-col"
            >
              <span className="font-medium text-gray-800">{p.name}</span>
              <span className="text-xs text-gray-400">{p.location}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white text-gray-700"
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}

export function PageHeader({ title, subtitle, propertyId, setPropertyId }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold font-heading text-navy">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <CurrencySwitcher />
        <PropertySwitcher propertyId={propertyId} setPropertyId={setPropertyId} />
      </div>
    </div>
  );
}
