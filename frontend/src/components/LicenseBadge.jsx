import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import licenseService from "@/services/licenseService";

const LicenseBadge = () => {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!isAuthLoaded || !isUserLoaded) return;
      try {
        const token = isSignedIn ? await getToken() : null;
        const email = user?.primaryEmailAddress?.emailAddress;
        const data = await licenseService.getLicenseStatus(token, email);
        setStatus(data);
      } catch (error) {
        console.error("Failed to load license status", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [isAuthLoaded, isUserLoaded, isSignedIn, getToken, user]);

  if (loading) return null;
  if (!status) return null;

  // Normalize the tier for robust comparison
  const rawTier = status.tier !== undefined ? status.tier : status.Tier;
  let tierValue = String(rawTier ?? "").toLowerCase();

  // Map numeric or string values to our normalized keys
  let normalizedTier = "unknown";
  if (tierValue === "1" || tierValue === "demo") normalizedTier = "demo";
  if (tierValue === "2" || tierValue === "demoexpired")
    normalizedTier = "demoexpired";
  if (tierValue === "3" || tierValue === "professional")
    normalizedTier = "professional";

  if (normalizedTier === "professional") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 border border-emerald-400/30 animate-in fade-in zoom-in duration-500">
        <Sparkles className="w-3.5 h-3.5" />
        <span>PROFESSIONAL</span>
      </div>
    );
  }

  if (normalizedTier === "demo") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>TRIAL ACTIVE</span>
      </div>
    );
  }

  if (normalizedTier === "demoexpired") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 shadow-sm animate-pulse">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>TRIAL EXPIRED</span>
      </div>
    );
  }

  // Fallback for Error
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 shadow-sm">
      <ShieldAlert className="w-3.5 h-3.5" />
      <span>LICENSE ERROR</span>
    </div>
  );
};

export default LicenseBadge;
