// Seed / mock data. Swap the "live" functions in liveRates.js for real
// data once a rate-intelligence API key is connected — pages don't need
// to change, only the data source.

export const PROPERTIES = [
  { id: "dhavara", name: "Dhavara Boutique Hotel", location: "Jaipur, India", rooms: 42, currency: "INR" },
  { id: "azure", name: "Azure Beach Resort", location: "Phuket, Thailand", rooms: 68, currency: "THB" },
];

export const COMPETITORS_BY_PROPERTY = {
  dhavara: ["Haveli Regency", "The Pink Manor", "Rambagh Court", "Jaipur Palacio"],
  azure: ["Lagoon Vista Resort", "Andaman Breeze", "Patong Cove Hotel", "Siam Sands"],
};

// Full channel list, in display order. "WEBSITE" = your direct rate.
export const OTAS = [
  "WEBSITE", "AGODA", "BOOKING.COM", "TRIP.COM", "EXPEDIA", "TRAVELOKA",
  "MAKEMYTRIP", "AIRBNB", "HRS", "TRIVAGO", "TRIPADVISOR", "LASTMINUTE",
  "SKYSCANNER", "BLUEPILLOW", "CLEARTRIP", "PRICELINE", "VIO.COM", "HUTCHGO", "KLOOK",
];

export const ROOM_TYPES = ["Deluxe Room", "Premium Suite", "Heritage Villa"];

// Deterministic pseudo-random so numbers don't jump around on every render
// (a real API feed would replace this entirely).
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function seedRateHistory(propertyId) {
  const days = 14;
  const base = propertyId === "dhavara" ? 4200 : 5600;
  const out = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    const drift = Math.sin(i / 2.3) * 180 + (i > 8 ? 220 : 0);
    const yourRate = Math.round(base + drift);
    const compAvg = Math.round(base + drift * 0.6 + 150 + Math.sin(i / 1.7) * 120);
    out.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      yourRate,
      compAvg,
    });
  }
  return out;
}

export function seedComparisonTable(propertyId) {
  const competitors = COMPETITORS_BY_PROPERTY[propertyId];
  const rows = [];
  ROOM_TYPES.forEach((room, ri) => {
    OTAS.forEach((ota, oi) => {
      const yourRate =
        3800 + ri * 900 + Math.round(seededRandom(ri * 97 + oi * 13) * 300 - 100);
      rows.push({
        room,
        ota,
        yourRate,
        competitors: competitors.map((c, ci) => ({
          name: c,
          rate: yourRate + Math.round(seededRandom(ri * 31 + oi * 7 + ci * 3) * 500 - 200),
        })),
      });
    });
  });
  return rows;
}

export function seedParityViolations(propertyId) {
  const competitors = COMPETITORS_BY_PROPERTY[propertyId];
  return [
    { channel: "BOOKING.COM", room: "Deluxe Room", yourDirect: 3800, otaRate: 3520, diffPct: -7.4, severity: "high" },
    { channel: "AGODA", room: "Premium Suite", yourDirect: 4700, otaRate: 4560, diffPct: -3.0, severity: "medium" },
    { channel: "EXPEDIA", room: "Heritage Villa", yourDirect: 5600, otaRate: 5600, diffPct: 0, severity: "ok" },
    { channel: "BOOKING.COM", room: "Premium Suite", yourDirect: 4700, otaRate: 4390, diffPct: -6.6, severity: "high" },
  ].map((v, i) => ({ ...v, competitorNote: competitors[i % competitors.length] }));
}

// Heatmap: hotel (yours + competitors) x OTA channel grid of index-100 rates
// (100 = at parity with your website rate; >100 = pricier; <100 = cheaper),
// matching the CRS Central reference layout.
export function seedHeatmapGrid(propertyId) {
  const property = PROPERTIES.find((p) => p.id === propertyId);
  const competitors = COMPETITORS_BY_PROPERTY[propertyId];
  const hotels = [property.name, ...competitors];

  return hotels.map((name, hi) => ({
    name,
    isYours: hi === 0,
    cells: OTAS.map((ota, oi) => {
      const seed = hi * 53 + oi * 17 + (propertyId === "dhavara" ? 1 : 2);
      const index = Math.round(88 + seededRandom(seed) * 40); // ~88-128
      return { ota, index };
    }),
  }));
}

export function seedRecommendations() {
  return [
    {
      title: "Raise Deluxe Room rate by 8%",
      rationale:
        "Competitor set trending up 12% over 7 days while your rate held flat. Demand signal: rising search volume for your dates.",
      impact: "+₹18,400 projected weekly RevPAR uplift",
      confidence: "High",
    },
    {
      title: "Match Booking.com rate to Direct channel",
      rationale:
        "Active parity violation detected — Booking.com is undercutting your direct rate by 7.4%, which risks rate-parity penalties and cannibalizes direct bookings.",
      impact: "Protects direct booking margin",
      confidence: "High",
    },
    {
      title: "Hold Heritage Villa pricing through next weekend",
      rationale: "Competitor set is at rough parity; no clear signal to move. Occupancy pace is on track against forecast.",
      impact: "Neutral — maintain position",
      confidence: "Medium",
    },
    {
      title: "Test a 5% discount on Premium Suite for shoulder dates",
      rationale:
        "Booking pace for the upcoming Tue–Thu window is 15% below the trailing 4-week average versus 2 nearby competitors already discounting.",
      impact: "Fill risk mitigation for low-demand midweek dates",
      confidence: "Medium",
    },
  ];
}

export function seedAlerts() {
  return [
    { id: 1, severity: "high", title: "Parity violation — Booking.com", detail: "Deluxe Room undercut by 7.4% vs. direct rate", time: "2h ago", read: false },
    { id: 2, severity: "medium", title: "Competitor price drop", detail: "Haveli Regency dropped Premium Suite rate by 9%", time: "5h ago", read: false },
    { id: 3, severity: "low", title: "Demand spike detected", detail: "Search volume +22% for next weekend's dates", time: "1d ago", read: true },
    { id: 4, severity: "high", title: "Parity violation — Booking.com", detail: "Premium Suite undercut by 6.6% vs. direct rate", time: "1d ago", read: true },
    { id: 5, severity: "low", title: "New competitor tracked", detail: "Jaipur Palacio added to competitor set", time: "3d ago", read: true },
  ];
}
