import React, { createContext, useContext, useState } from "react";

const DateRangeContext = createContext(null);

function defaultCheckIn() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
function defaultCheckOut() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
}

export function DateRangeProvider({ children }) {
  const [checkIn, setCheckIn] = useState(defaultCheckIn());
  const [checkOut, setCheckOut] = useState(defaultCheckOut());

  return (
    <DateRangeContext.Provider value={{ checkIn, checkOut, setCheckIn, setCheckOut }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used inside a DateRangeProvider");
  return ctx;
}

export function formatDateRange(checkIn, checkOut) {
  const opts = { month: "short", day: "numeric" };
  const inD = new Date(checkIn + "T00:00:00");
  const outD = new Date(checkOut + "T00:00:00");
  return `${inD.toLocaleDateString("en-US", opts)} – ${outD.toLocaleDateString("en-US", opts)}`;
}
