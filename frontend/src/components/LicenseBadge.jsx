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

    window.addEventListener("license-refresh", fetchStatus);
    return () => window.removeEventListener("license-refresh", fetchStatus);
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

  const formatStorage = (bytes) => {
    if (!bytes) return "0 GB";
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
  };

  const totalItems = status.totalItemsAllotted ?? status.TotalItemsAllotted;
  const usedItems = status.totalItemsUsed ?? status.TotalItemsUsed ?? 0;
  const totalStorage = status.totalStorageAllotted ?? status.TotalStorageAllotted;
  const usedStorage = status.totalStorageUsed ?? status.TotalStorageUsed ?? 0;

  if (normalizedTier === "professional") {
    return (
      <div className="flex flex-col items-start lg:items-end gap-1 px-1">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-[9px] font-black shadow-sm shadow-brand-500/20 border border-brand-400/30 tracking-wider">
          <Sparkles className="w-2.5 h-2.5" />
          <span>PROFESSIONAL PLAN</span>
        </div>
        <div className="flex gap-2 text-[8px] font-black text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-md border border-brand-100 tracking-tight">
          <span className="flex items-center gap-1">
            <Shield className="w-2 h-2 text-brand-500" />
            {usedItems.toLocaleString()} / {totalItems?.toLocaleString()}
          </span>
          <span className="w-px h-2 bg-brand-200 self-center"></span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-2 h-2 text-brand-500" />
            {formatStorage(usedStorage)} / {formatStorage(totalStorage)}
          </span>
        </div>
      </div>
    );
  }


  if (normalizedTier === "demo") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
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
