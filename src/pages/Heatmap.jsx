import React, { useMemo } from "react";
import { Star, RefreshCw, ExternalLink, Calendar, AlertCircle } from "lucide-react";
import { Card, PageHeader } from "../components/ui";
import { seedHeatmapGrid, OTAS } from "../lib/seedData";
import { useCurrency } from "../components/CurrencyContext";
import { formatRaw } from "../lib/currency";
import { useSharedRates } from "../components/RatesContext";
import { useCompetitors } from "../lib/useCompetitors";
import { useProperties } from "../components/PropertiesContext";
import { useDateRange, formatDateRange } from "../components/DateRangeContext";
import { getOtaSearchLink } from "../lib/liveRates";

export default function HeatmapPage({ propertyId, setPropertyId }) {
  const { currency } = useCurrency();
  const { allProperties } = useProperties();
  const { competitors, loading } = useCompetitors(propertyId);
  const property = allProperties.find((p) => p.id === propertyId);
  const { checkIn, checkOut } = useDateRange();
  const grid = useMemo(
    () => seedHeatmapGrid(propertyId, property?.name, competitors),
    [propertyId, property, competitors]
  );

  const { live, hotelsData, loading: refreshing, refresh, isStale } = useSharedRates();

  const showLive = live && !isStale;
  const yourLiveWebsiteRate = showLive ? hotelsData[grid[0]?.name]?.channels?.["WEBSITE"]?.rate : null;

  if (loading) return null;

  return (
    <div>
      <PageHeader title="Heatmap" subtitle="Rate index by hotel and channel — 100 = parity with your website rate" propertyId={propertyId} setPropertyId={setPropertyId} />

      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
        <Calendar size={13} className="text-gray-400" />
        Checking rates for {formatDateRange(checkIn, checkOut)} <span className="text-gray-400">(set on Rate Comparison)</span>
      </div>

      {live && isStale && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
          <AlertCircle size={13} />
          Dates or currency changed since the last refresh — click "Refresh rates" to update the live numbers below.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex gap-3 sm:gap-4 text-xs text-gray-500 flex-wrap">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#DCFCE7" }} /> Cheaper than you</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#FEF3C7" }} /> Near parity</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#FEE2E2" }} /> Pricier than you</div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-400">
            {showLive ? "Live rates — click any cell to open its source" : live && isStale ? "Showing last refresh (now stale)" : "Sample data"}
          </span>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh rates"}
          </button>
        </div>
      </div>

      <Card className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-cream sticky top-0">
              <th className="px-4 py-3 text-left font-medium text-gray-600 sticky left-0 bg-cream z-10 w-56 min-w-[14rem]">Hotel</th>
              {OTAS.map((ota) => (
                <th key={ota} className="px-3 py-3 text-center font-medium text-gray-600 whitespace-nowrap">{ota}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row) => (
              <tr key={row.name} className="border-b border-gray-50">
                <td className={`px-4 py-3 sticky left-0 bg-white z-10 w-56 min-w-[14rem] leading-tight ${row.isYours ? "font-semibold text-navy" : "text-gray-700"}`}>
                  {row.isYours && <Star size={12} className="inline mr-1.5 -mt-0.5 text-gold fill-gold" />}
                  {row.name}
                </td>
                {row.cells.map((cell) => {
                  const liveCell = showLive ? hotelsData[row.name]?.channels?.[cell.ota] : null;
                  const hasLiveIndex = liveCell?.rate && yourLiveWebsiteRate && liveCell?.link;
                  const displayIndex = hasLiveIndex ? Math.round((liveCell.rate / yourLiveWebsiteRate) * 100) : null;
                  
                  const { bg, text } = (() => {
                    if (showLive && !hasLiveIndex) {
                      return { bg: "#F3F4F6", text: "#9CA3AF" };
                    }
                    const idx = displayIndex !== null ? displayIndex : cell.index;
                    if (idx < 97) return { bg: "#DCFCE7", text: "#15803D" };
                    if (idx <= 110) return { bg: "#FEF3C7", text: "#92400E" };
                    return { bg: "#FEE2E2", text: "#B91C1C" };
                  })();

                  const tooltip = hasLiveIndex 
                    ? `${formatRaw(liveCell.rate, currency)} (live index: ${displayIndex}%)` 
                    : showLive 
                      ? `No live rate available to calculate index — click to search ${cell.ota} manually` 
                      : `Sample data index: ${cell.index}%`;

                  // Fallback: generate a direct search link to the hotel on that specific OTA
                  const fallbackLink = getOtaSearchLink(row.name, cell.ota, checkIn, checkOut);

                  const content = (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold min-w-[52px] justify-center"
                      style={{ background: bg, color: text }}
                      title={tooltip}
                    >
                      {showLive && !hasLiveIndex ? "—" : (displayIndex !== null ? displayIndex : cell.index)}
                      <ExternalLink size={8} className={hasLiveIndex ? "opacity-100" : "opacity-30"} />
                    </span>
                  );

                  return (
                    <td key={cell.ota} className="px-1.5 py-1.5 text-center">
                      <a href={hasLiveIndex ? liveCell.link : fallbackLink} target="_blank" rel="noopener noreferrer">
                        {content}
                      </a>
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
