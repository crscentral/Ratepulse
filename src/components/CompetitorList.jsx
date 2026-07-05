import React, { useEffect, useState, useRef } from "react";
import { X, Plus, Search } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function CompetitorList({ propertyId }) {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const debounceRef = useRef(null);

  async function load() {
    const { data, error } = await supabase
      .from("competitors")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: true });
    setCompetitors(error ? [] : data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [propertyId]);

  function handleQueryChange(value) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.functions.invoke("places-autocomplete", { body: { input: value } });
      if (error || !data || data.unavailable) {
        setPredictions([]);
        return;
      }
      setPredictions(data.predictions || []);
    }, 300);
  }

  async function addCompetitor(name) {
    if (!name.trim()) return;
    await supabase.from("competitors").insert({ property_id: propertyId, name: name.trim() });
    setQuery("");
    setPredictions([]);
    setAdding(false);
    load();
  }

  async function handleDelete(id) {
    await supabase.from("competitors").delete().eq("id", id);
    load();
  }

  if (loading) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        {competitors.map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600"
          >
            {c.name}
            <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500">
              <X size={11} />
            </button>
          </span>
        ))}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 px-2.5 py-1 border border-dashed border-gray-300 rounded-full text-xs text-gray-400 hover:border-gray-400"
          >
            <Plus size={11} /> Add competitor
          </button>
        )}
      </div>

      {adding && (
        <div className="relative mt-2 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && query && !predictions.length && addCompetitor(query)}
            placeholder="Search hotel name (or type freely + Enter)"
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none"
          />
          {predictions.length > 0 && (
            <div className="border border-gray-200 rounded-md mt-1 bg-white shadow-sm max-h-40 overflow-auto">
              {predictions.map((p) => (
                <button
                  key={p.placeId}
                  onClick={() => addCompetitor(p.description.split(",")[0])}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  {p.description}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => { setAdding(false); setQuery(""); setPredictions([]); }} className="text-xs text-gray-400 mt-1 underline">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
