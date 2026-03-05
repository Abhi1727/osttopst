import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import licenseService from "@/services/licenseService";

const LicenseBadge = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!isLoaded) return;
      try {
        const token = isSignedIn ? await getToken() : null;
        const data = await licenseService.getLicenseStatus(token);
        setStatus(data);
      } catch (error) {
        console.error("Failed to load license status", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [isLoaded, isSignedIn, getToken]);

  if (loading) return null;
  if (!status) return null;

  // Map the backend LicenseTier (e.g., "Professional", "DemoActive", "DemoExpired")
  const tier = status.tier;

  if (tier === "Professional") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 border border-emerald-400/30 animate-in fade-in zoom-in duration-500">
        <Sparkles className="w-3.5 h-3.5" />
        <span>PROFESSIONAL</span>
      </div>
    );
  }

  if (tier === "Demo") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>TRIAL ACTIVE</span>
      </div>
    );
  }

  // Default for Expired or Error
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 shadow-sm">
      <ShieldAlert className="w-3.5 h-3.5" />
      <span>EXPIRED / LIMIT REACHED</span>
    </div>
  );
};

export default LicenseBadge;
