import React, { useMemo } from "react";
import ComingSoon from "../components/ComingSoon";
import { isSeedProperty } from "../components/PropertiesContext";
import { Star, RefreshCw } from "lucide-react";
import { Card, PageHeader } from "../components/ui";
import { seedHeatmapGrid, OTAS } from "../lib/seedData";
import { useCurrency } from "../components/CurrencyContext";
import { formatCurrency } from "../lib/currency";
import { useLiveRates } from "../lib/liveRates";
import { PROPERTIES } from "../lib/seedData";

function colorForIndex(index) {
  // index is roughly "rate relative to your own website rate", where
  // 100 = parity. <97 = cheaper (green), 97-110 = close (orange), >110 = pricier (red).
  if (index < 97) return { bg: "#DCFCE7", text: "#15803D" };
  if (index <= 110) return { bg: "#FEF3C7", text: "#92400E" };
  return { bg: "#FEE2E2", text: "#B91C1C" };
}

export default function HeatmapPage({ propertyId, setPropertyId }) {
  const { currency } = useCurrency();
  const grid = useMemo(() => seedHeatmapGrid(propertyId), [propertyId]);
  const property = PROPERTIES.find((p) => p.id === propertyId);

  const { live, loading, refresh } = useLiveRates({
    propertyId,
    hotelName: property?.name,
    city: property?.location,
    fallback: grid,
  });

  if (!isSeedProperty(propertyId)) {
    return <ComingSoon title="Heatmap" subtitle="Rate index by hotel and channel" propertyId={propertyId} setPropertyId={setPropertyId} />;
  }

  return (
    <div>
      <PageHeader title="Heatmap" subtitle="Rate index by hotel and channel — 100 = parity with your website rate" propertyId={propertyId} setPropertyId={setPropertyId} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#DCFCE7" }} /> Cheaper than you</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#FEF3C7" }} /> Near parity</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#FEE2E2" }} /> Pricier than you</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{live ? "Showing live rates" : "Sample data"}</span>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing…" : "Refresh rates"}
          </button>
        </div>
      </div>

      <Card className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-cream sticky top-0">
              <th className="px-4 py-3 text-left font-medium text-gray-600 sticky left-0 bg-cream z-10">Hotel</th>
              {OTAS.map((ota) => (
                <th key={ota} className="px-3 py-3 text-center font-medium text-gray-600 whitespace-nowrap">{ota}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row) => (
              <tr key={row.name} className="border-b border-gray-50">
                <td className={`px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10 ${row.isYours ? "font-semibold text-navy" : "text-gray-700"}`}>
                  {row.isYours && <Star size={12} className="inline mr-1.5 -mt-0.5 text-gold fill-gold" />}
                  {row.name}
                </td>
                {row.cells.map((cell) => {
                  const { bg, text } = colorForIndex(cell.index);
                  return (
                    <td key={cell.ota} className="px-1.5 py-1.5 text-center">
                      <span
                        className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold min-w-[52px]"
                        style={{ background: bg, color: text }}
                        title={formatCurrency(cell.index * 38, currency)}
                      >
                        {cell.index}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
