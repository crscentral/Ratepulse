import React, { useMemo, useState } from "react";
import { Filter, RefreshCw, Star, ExternalLink, Calendar, AlertCircle } from "lucide-react";
import { Card, PageHeader } from "../components/ui";
import { ROOM_TYPES, OTAS, seedComparisonTable } from "../lib/seedData";
import { useCurrency } from "../components/CurrencyContext";
import { formatCurrency, formatRaw } from "../lib/currency";
import { useMultiChannelRates } from "../lib/liveRates";
import { useCompetitors } from "../lib/useCompetitors";
import { useProperties } from "../components/PropertiesContext";
import { useDateRange } from "../components/DateRangeContext";

export default function ComparisonPage({ propertyId, setPropertyId }) {
  const { currency } = useCurrency();
  const { allProperties } = useProperties();
  const { competitors, loading } = useCompetitors(propertyId);
  const property = allProperties.find((p) => p.id === propertyId);
  const [roomType, setRoomType] = useState(ROOM_TYPES[0]);
  const roomIndex = ROOM_TYPES.indexOf(roomType);
  const { checkIn, checkOut, setCheckIn, setCheckOut } = useDateRange();

  const { hotels, rates } = useMemo(
    () => seedComparisonTable(propertyId, property?.name, competitors),
    [propertyId, property, competitors]
  );

  const hotelNames = useMemo(() => hotels.map((h) => h.name), [hotels]);
  const { live, hotelsData, loading: refreshing, refresh, isStale } = useMultiChannelRates({
    hotelNames,
    city: property?.location,
    checkIn,
    checkOut,
    currency,
  });

  // Only trust live cells when the data was actually fetched with the
  // dates/currency currently on screen — otherwise treat as not-live so we
  // never show a stale number under the wrong currency symbol or date.
  const showLive = live && !isStale;

  if (loading) return null;

  const invalidDateRange = checkIn && checkOut && checkIn >= checkOut;

  return (
    <div>
      <PageHeader title="Rate Comparison" subtitle="Your rates vs. tracked competitors, by OTA channel and room type" propertyId={propertyId} setPropertyId={setPropertyId} />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Checking rates for:</span>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded-md text-xs bg-white"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded-md text-xs bg-white"
          />
          <span className="text-xs text-gray-400">— applies to Rate Comparison, Rate Parity, and Heatmap</span>
        </div>
      </div>

      {invalidDateRange && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
          <AlertCircle size={13} />
          Check-out must be after check-in — pick a real date range before refreshing, or the live lookup will fail.
        </div>
      )}

      {live && isStale && !invalidDateRange && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
          <AlertCircle size={13} />
          Dates or currency changed since the last refresh — click "Refresh rates" to update the live numbers below.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-400 shrink-0" />
          {ROOM_TYPES.map((r) => (
            <button
              key={r}
              onClick={() => setRoomType(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                roomType === r ? "bg-navy text-white border-navy" : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-400">
            {showLive ? "Live rates — click any rate to open its source" : live && isStale ? "Showing last refresh (now stale)" : "Sample data"}
          </span>
          <button
            onClick={refresh}
            disabled={refreshing || invalidDateRange}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-300 disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh rates"}
          </button>
        </div>
      </div>

      {showLive && (
        <p className="text-xs text-gray-400 mb-3">
          Live rates show each hotel's current overall rate (not broken down by room type) — cells without a live match still show sample data.
        </p>
      )}

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
            {hotels.map((hotel, hi) => (
              <tr key={hotel.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className={`px-4 py-3 sticky left-0 bg-white z-10 w-56 min-w-[14rem] leading-tight ${hotel.isYours ? "font-semibold text-navy" : "text-gray-700"}`}>
                  {hotel.isYours && <Star size={12} className="inline mr-1.5 -mt-0.5 text-gold fill-gold" />}
                  {hotel.name}
                </td>
                {OTAS.map((ota) => {
                  const liveCell = showLive ? hotelsData[hotel.name]?.channels?.[ota] : null;
                  const sampleRate = rates[hi][roomIndex][ota];
                  const yourSampleRate = rates[0][roomIndex][ota];
                  const diff = hi === 0 ? 0 : sampleRate - yourSampleRate;

                  if (liveCell?.rate && liveCell?.link) {
                    return (
                      <td key={ota} className="px-3 py-3 text-center whitespace-nowrap">
                        <a
                          href={liveCell.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-navy hover:underline"
                        >
                          {formatRaw(liveCell.rate, currency)}
                          <ExternalLink size={10} />
                        </a>
                      </td>
                    );
                  }

                  return (
                    <td key={ota} className="px-3 py-3 text-center whitespace-nowrap">
                      <span className={hotel.isYours ? "font-semibold text-navy" : "text-gray-700"}>
                        {formatCurrency(sampleRate, currency)}
                      </span>
                      {!hotel.isYours && (
                        <span className={`ml-1 text-xs ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>
                          {diff > 0 ? "▲" : diff < 0 ? "▼" : "–"}
                        </span>
                      )}
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
