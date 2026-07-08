import React, { useState } from "react";
import { X } from "lucide-react";

export default function EditPropertyModal({ property, onClose, onSave }) {
  const [name, setName] = useState(property.name);
  const [location, setLocation] = useState(property.location || "");
  const [rooms, setRooms] = useState(property.rooms || "");

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ name, location, rooms: Number(rooms) || 0 });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold font-heading text-navy mb-4">Edit property</h2>
        <form onSubmit={handleSubmit}>
          <label className="text-xs font-medium text-gray-600">Hotel name</label>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 mb-3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          />
          <label className="text-xs font-medium text-gray-600">Location</label>
          <input
            type="text" value={location} onChange={(e) => setLocation(e.target.value)}
            className="w-full mt-1 mb-3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          />
          <label className="text-xs font-medium text-gray-600">Number of rooms</label>
          <input
            type="number" value={rooms} onChange={(e) => setRooms(e.target.value)}
            className="w-full mt-1 mb-4 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          />
          <button type="submit" className="w-full py-2.5 rounded-md text-sm font-medium text-white bg-navy">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
