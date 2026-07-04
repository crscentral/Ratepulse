import React, { useState, useRef } from "react";
import { X, Search, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function AddPropertyModal({ onClose, onAdd }) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchUnavailable, setSearchUnavailable] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [rooms, setRooms] = useState("");
  const debounceRef = useRef(null);

  function handleQueryChange(value) {
    setQuery(value);
    setSelected(null);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.functions.invoke("places-autocomplete", {
        body: { input: value },
      });
      if (error || !data || data.unavailable) {
        setSearchUnavailable(true);
        setPredictions([]);
        return;
      }
      setPredictions(data.predictions || []);
    }, 300);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (selected) {
      onAdd({ name: selected.description.split(",")[0], location: selected.description, rooms: Number(rooms) || 0 });
    } else {
      onAdd({ name: manualName, location: manualLocation, rooms: Number(rooms) || 0 });
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold font-heading text-navy mb-4">Add new property</h2>

        <form onSubmit={handleSubmit}>
          <label className="text-xs font-medium text-gray-600">Search hotel by name & city</label>
          <div className="relative mt-1 mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="e.g. Dhavara Boutique Hotel, Jaipur"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
          </div>

          {predictions.length > 0 && (
            <div className="border border-gray-200 rounded-md mb-3 max-h-40 overflow-auto">
              {predictions.map((p) => (
                <button
                  type="button"
                  key={p.placeId}
                  onClick={() => {
                    setSelected(p);
                    setQuery(p.description);
                    setPredictions([]);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  {p.description}
                </button>
              ))}
            </div>
          )}

          {searchUnavailable && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2.5 mb-3">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>
                Live hotel search isn't connected yet (needs a Google Places API key). Enter the details manually below instead.
              </span>
            </div>
          )}

          {(searchUnavailable || query.length === 0) && !selected && (
            <>
              <label className="text-xs font-medium text-gray-600">Hotel name (manual entry)</label>
              <input
                type="text" value={manualName} onChange={(e) => setManualName(e.target.value)}
                placeholder="Hotel name"
                className="w-full mt-1 mb-3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
              />
              <label className="text-xs font-medium text-gray-600">Location</label>
              <input
                type="text" value={manualLocation} onChange={(e) => setManualLocation(e.target.value)}
                placeholder="City, Country"
                className="w-full mt-1 mb-3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
              />
            </>
          )}

          <label className="text-xs font-medium text-gray-600">Number of rooms</label>
          <input
            type="number" value={rooms} onChange={(e) => setRooms(e.target.value)}
            placeholder="e.g. 42"
            className="w-full mt-1 mb-4 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          />

          <button type="submit" className="w-full py-2.5 rounded-md text-sm font-medium text-white bg-navy">
            Add Property
          </button>
        </form>
      </div>
    </div>
  );
}
