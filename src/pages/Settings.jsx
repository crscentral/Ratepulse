import React, { useState } from "react";
import { Lock, CheckCircle2 } from "lucide-react";
import { Card } from "../components/ui";
import { supabase } from "../lib/supabaseClient";

export default function SettingsPage({ profile }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(null); // null | "success" | error string

  async function handleChangePassword(e) {
    e.preventDefault();
    setStatus(null);
    if (newPassword.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("Passwords don't match.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setStatus(error.message);
    else {
      setStatus("success");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold font-heading text-navy mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Signed in as {profile.email}</p>

      <Card className="p-6 max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-navy" />
          <h2 className="text-sm font-semibold text-navy">Change password</h2>
        </div>
        <form onSubmit={handleChangePassword}>
          <label className="text-xs font-medium text-gray-600">New password</label>
          <input
            type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full mt-1 mb-3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          />
          <label className="text-xs font-medium text-gray-600">Confirm new password</label>
          <input
            type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="w-full mt-1 mb-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          />
          {status === "success" && (
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle2 size={12} /> Password updated.</p>
          )}
          {status && status !== "success" && <p className="text-xs text-red-600 mt-2">{status}</p>}
          <button type="submit" className="w-full py-2.5 mt-4 rounded-md text-sm font-medium text-white bg-navy">
            Update Password
          </button>
        </form>
      </Card>
    </div>
  );
}
