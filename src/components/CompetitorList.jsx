import React, { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function CompetitorList({ propertyId }) {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

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

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    await supabase.from("competitors").insert({ property_id: propertyId, name: newName.trim() });
    setNewName("");
    setAdding(false);
    load();
  }

  async function handleDelete(id) {
    await supabase.from("competitors").delete().eq("id", id);
    load();
  }

  if (loading) return null;

  return (
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

      {adding ? (
        <form onSubmit={handleAdd} className="flex items-center gap-1.5">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => !newName && setAdding(false)}
            placeholder="Competitor name"
            className="px-2.5 py-1 border border-gray-300 rounded-full text-xs focus:outline-none w-40"
          />
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 px-2.5 py-1 border border-dashed border-gray-300 rounded-full text-xs text-gray-400 hover:border-gray-400"
        >
          <Plus size={11} /> Add competitor
        </button>
      )}
    </div>
  );
}
