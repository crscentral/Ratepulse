import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Card } from "./ui";

export default function AdminApprovals() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("profiles").select("*").eq("approved", false).order("requested_at", { ascending: true });
    setPending(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    await supabase.from("profiles").update({ approved: true, approved_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  async function reject(id) {
    await supabase.from("profiles").delete().eq("id", id);
    load();
  }

  if (loading) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck size={16} className="text-navy" />
        <h1 className="text-2xl font-semibold font-heading text-navy">Pending Access Requests</h1>
      </div>
      {pending.length === 0 ? (
        <p className="text-sm text-gray-400">No pending requests.</p>
      ) : (
        <Card className="divide-y divide-gray-100">
          {pending.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-sm font-medium text-gray-800">{p.email}</div>
                <div className="text-xs text-gray-400">Requested {new Date(p.requested_at).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => approve(p.id)} className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button onClick={() => reject(p.id)} className="flex items-center gap-1 text-xs font-medium text-red-500">
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
