import React, { useState, useEffect } from "react";
import { Clock, Lock, TrendingUp } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

/**
 * Wrap the app with <AuthGate>{(profile, signOut) => <App ... />}</AuthGate>
 * profile = { id, email, full_name, hotel_name, approved, is_admin }
 */
export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [error, setError] = useState("");
  const [justSignedUp, setJustSignedUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    async function loadProfile() {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (!cancelled) setProfile(error ? null : data);
    }
    loadProfile();
    // Poll every 8s so a pending user's screen auto-advances once approved.
    const interval = setInterval(loadProfile, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session]);

  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { hotel_name: hotelName } },
    });
    if (error) {
      setError(error.message);
      return;
    }
    // Store hotel_name onto the profile row the trigger just created.
    if (data.user) {
      await supabase.from("profiles").update({ hotel_name: hotelName }).eq("id", data.user.id);
    }
    setJustSignedUp(true);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (loading) return null;

  // Not logged in yet
  if (!session) {
    return (
      <GateShell>
        <div className="flex mb-5 border-b border-gray-100">
          <button
            onClick={() => { setMode("signin"); setError(""); }}
            className={`flex-1 pb-2.5 text-sm font-medium border-b-2 -mb-px ${mode === "signin" ? "border-navy text-navy" : "border-transparent text-gray-400"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 pb-2.5 text-sm font-medium border-b-2 -mb-px ${mode === "signup" ? "border-navy text-navy" : "border-transparent text-gray-400"}`}
          >
            Sign Up
          </button>
        </div>

        {mode === "signin" && (
          <form onSubmit={handleSignIn}>
            <label className="text-xs font-medium text-gray-600">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourhotel.com"
              className="w-full mt-1 mb-3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
            <label className="text-xs font-medium text-gray-600">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-1 mb-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
            {error && <p className="text-xs text-red-600 mt-2 mb-1">{error}</p>}
            <button type="submit" className="w-full py-2.5 mt-4 rounded-md text-sm font-medium text-white bg-navy">
              Sign In
            </button>
          </form>
        )}

        {mode === "signup" && !justSignedUp && (
          <form onSubmit={handleSignUp}>
            <label className="text-xs font-medium text-gray-600">Hotel / Property name</label>
            <input
              type="text" required value={hotelName} onChange={(e) => setHotelName(e.target.value)}
              placeholder="e.g. Dhavara Boutique Hotel"
              className="w-full mt-1 mb-3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
            <label className="text-xs font-medium text-gray-600">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourhotel.com"
              className="w-full mt-1 mb-3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
            <label className="text-xs font-medium text-gray-600">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full mt-1 mb-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
            {error && <p className="text-xs text-red-600 mt-2 mb-1">{error}</p>}
            <button type="submit" className="w-full py-2.5 mt-4 rounded-md text-sm font-medium text-white bg-navy">
              Request Access
            </button>
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1.5">
              <Lock size={12} /> A CRS Central admin reviews every new sign-up before access is granted.
            </div>
          </form>
        )}

        {mode === "signup" && justSignedUp && (
          <div className="text-center py-4">
            <Clock size={28} className="mx-auto mb-3 text-gold" />
            <h2 className="text-lg font-semibold mb-1 font-heading text-navy">Request submitted</h2>
            <p className="text-sm text-gray-500">
              You can sign in now, but you'll see a pending screen until a CRS Central admin approves your account.
            </p>
          </div>
        )}
      </GateShell>
    );
  }

  // Logged in, but not yet approved
  if (!profile || !profile.approved) {
    return (
      <GateShell>
        <div className="text-center py-4">
          <Clock size={28} className="mx-auto mb-3 text-gold" />
          <h2 className="text-lg font-semibold mb-1 font-heading text-navy">Pending approval</h2>
          <p className="text-sm text-gray-500 mb-5">
            You're signed in as <span className="font-medium text-gray-700">{session.user.email}</span>. A CRS Central
            admin needs to approve your access — this page updates automatically once approved.
          </p>
          <button onClick={signOut} className="text-sm font-medium underline text-navy">Sign out</button>
        </div>
      </GateShell>
    );
  }

  // Approved
  return children(profile, signOut);
}

function GateShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream font-body">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-md flex items-center justify-center bg-navy">
              <TrendingUp size={18} className="text-gold" />
            </div>
            <span className="text-xl font-semibold font-heading text-navy">RatePulse</span>
          </div>
          <p className="text-sm text-gray-500">by CRS Central — Revenue Intelligence</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-7">{children}</div>
      </div>
    </div>
  );
}
