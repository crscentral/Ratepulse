import React, { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card, Badge, PageHeader } from "../components/ui";
import { PROPERTIES, OTAS } from "../lib/seedData";
import AddPropertyModal from "../components/AddPropertyModal";
import EditPropertyModal from "../components/EditPropertyModal";
import CompetitorList from "../components/CompetitorList";
import { supabase } from "../lib/supabaseClient";

export default function PropertiesPage({ propertyId, setPropertyId }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null); // custom property being edited
  const [customProperties, setCustomProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadCustomProperties() {
    const { data, error } = await supabase
      .from("custom_properties")
      .select("*")
      .order("created_at", { ascending: false });
    setCustomProperties(error ? [] : data);
    setLoading(false);
  }

  useEffect(() => {
    loadCustomProperties();
  }, []);

  async function handleAddProperty(property) {
    await supabase.from("custom_properties").insert({
      name: property.name,
      location: property.location,
      rooms: property.rooms,
    });
    setShowAddModal(false);
    loadCustomProperties();
  }

  async function handleSaveEdit(updates) {
    await supabase.from("custom_properties").update(updates).eq("id", editingProperty.id);
    setEditingProperty(null);
    loadCustomProperties();
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this property? This can't be undone.")) return;
    await supabase.from("custom_properties").delete().eq("id", id);
    loadCustomProperties();
  }

  return (
    <div>
      <PageHeader title="Properties" subtitle="Manage tracked properties and their competitor sets" propertyId={propertyId} setPropertyId={setPropertyId} />
      <div className="space-y-4">
        {PROPERTIES.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-navy">{p.name}</h3>
                <p className="text-xs text-gray-500">{p.location} · {p.rooms} rooms · {p.currency}</p>
              </div>
              <Badge tone="gold">OTAs: {OTAS.length - 1} channels</Badge>
            </div>
            <div className="text-xs text-gray-500 mb-1.5 font-medium">Competitor set</div>
            <CompetitorList propertyId={p.id} />
          </Card>
        ))}

        {!loading && customProperties.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-navy">{p.name}</h3>
                <p className="text-xs text-gray-500">{p.location} {p.rooms ? `· ${p.rooms} rooms` : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setEditingProperty(p)} className="text-gray-400 hover:text-navy" title="Edit">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500" title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-1.5 font-medium">Competitor set</div>
            <CompetitorList propertyId={p.id} />
            <p className="text-xs text-gray-400 mt-3">
              Full dashboard tracking (rates, parity, heatmap) activates once a live rate-data source is connected.
            </p>
          </Card>
        ))}

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition"
        >
          + Add new property
        </button>
      </div>

      {showAddModal && <AddPropertyModal onClose={() => setShowAddModal(false)} onAdd={handleAddProperty} />}
      {editingProperty && (
        <EditPropertyModal property={editingProperty} onClose={() => setEditingProperty(null)} onSave={handleSaveEdit} />
      )}
    </div>
  );
}
