import React, { useState } from "react";
import { Download } from "lucide-react";
import { Card, PageHeader } from "../components/ui";

export default function ExportPage({ propertyId, setPropertyId }) {
  const [format, setFormat] = useState("CSV");
  const [range, setRange] = useState("Last 14 days");
  return (
    <div>
      <PageHeader title="Export" subtitle="Download rate data, parity status, or recommendations" propertyId={propertyId} setPropertyId={setPropertyId} />
      <Card className="p-6 max-w-lg">
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Report type</label>
          <div className="grid grid-cols-3 gap-2">
            {["Rate Data", "Parity Status", "Recommendations"].map((t, i) => (
              <button
                key={t}
                className={`px-3 py-2 border rounded-md text-xs ${
                  i === 0 ? "text-white bg-navy border-navy" : "text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Date range</label>
          <select value={range} onChange={(e) => setRange(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm">
            <option>Last 7 days</option>
            <option>Last 14 days</option>
            <option>Last 30 days</option>
            <option>Custom range</option>
          </select>
        </div>
        <div className="mb-6">
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Format</label>
          <div className="flex gap-2">
            {["CSV", "PDF"].map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium border ${
                  format === f ? "bg-navy text-white border-navy" : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <button className="w-full py-2.5 rounded-md text-sm font-medium text-white flex items-center justify-center gap-2 bg-navy">
          <Download size={15} /> Generate & Download
        </button>
        <p className="text-xs text-gray-400 mt-3">Preview only — production build generates real files from live data.</p>
      </Card>
    </div>
  );
}
