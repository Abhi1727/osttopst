import React, { useEffect, useState } from "react";
import History from "lucide-react/dist/esm/icons/history";
import Download from "lucide-react/dist/esm/icons/download";
import Clock from "lucide-react/dist/esm/icons/clock";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import RefreshCcw from "lucide-react/dist/esm/icons/refresh-ccw";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import X from "lucide-react/dist/esm/icons/x";
import { Button } from "@/components/ui/button";
import { getRecentSessions, deleteSession, deleteAllSessions } from "../services/api";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { conversionService } from "../services/conversionService";

const formatDistanceToNow = (date) => {
  const diffTime = Math.abs(new Date() - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "today";
  return `${diffDays} days ago`;
};

const ConversionHistory = ({ onRestore }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const fetchHistory = async () => {
    if (!isLoaded || !isSignedIn) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      const data = await getRecentSessions(token);
      console.log("[ConversionHistory] Fetched sessions:", data);
      setSessions(data);
    } catch (err) {
      console.error("[ConversionHistory] Failed to fetch history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isLoaded, isSignedIn]);

  const handleDelete = async (sessionId) => {
    try {
      const token = await getToken();
      await deleteSession(sessionId, token);
      setSessions(sessions.filter((s) => s.sessionId !== sessionId));
      toast.success("Session deleted");
      fetchHistory();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleDownloadPst = async (session) => {
    try {
      const toastId = toast.loading("Preparing download...");
      await conversionService.convertToPst(
        session.sessionId,
        getToken,
        false, // excludeEmpty
        null,  // onProgress
        null,  // signal
        session.email
      );
      toast.dismiss(toastId);
      toast.success("Download started!");
    } catch (err) {
      toast.error("Download failed: " + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all recent conversions?")) return;
    try {
      const token = await getToken();
      await deleteAllSessions(token);
      setSessions([]);
      toast.success("All sessions cleared");
    } catch (err) {
      toast.error("Failed to clear sessions");
    }
  };


  if (!isLoaded || !isSignedIn) return null;

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCcw className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );

  if (sessions.length === 0) {
    console.log("[ConversionHistory] No sessions found, returning null");
    return (
      <div className="text-center py-8 px-6 rounded-3xl border border-zinc-200/50 bg-white/40 backdrop-blur-sm shadow-sm w-full mx-auto">
        <History className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
        <h3 className="font-bold text-zinc-900 text-sm">No Recent Conversions</h3>
        <p className="text-zinc-500 text-xs">
          Upload an OST file to see your history here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm overflow-hidden w-full mx-auto">
      <div className="p-6 border-b border-zinc-50 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-brand-600" />
          <h3 className="font-black text-zinc-900 tracking-tight">
            Recent Conversions
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider"
          >
            Clear All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchHistory}
            className="text-zinc-400 hover:text-zinc-600"
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>

      </div>

      <div className="divide-y divide-zinc-50">
        {sessions.map((session) => (
          <div
            key={session.sessionId}
            className="p-4 hover:bg-zinc-50/50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl ${session.status === "Uploaded" ? "bg-brand-50 text-brand-600" : "bg-zinc-50 text-zinc-400"}`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 text-sm line-clamp-1">
                  {session.originalFileName}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(session.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      session.status === "Uploaded"
                        ? "bg-brand-100 text-brand-700 font-bold"
                        : ["Assembling", "Converting", "Exporting", "Processing"].includes(session.status)
                          ? "bg-brand-50 text-brand-600 animate-pulse"
                          : session.status === "Ready" || session.status?.includes("Ready")
                            ? "bg-green-100 text-green-700"
                            : session.status?.includes("Failed") || session.status?.includes("Limit")
                              ? "bg-red-100 text-red-700"
                              : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {["Uploaded", "Converting", "Exporting", "Assembling", "Failed", "AssemblyFailed"].some(s => session.status?.includes(s)) && (
                <Button
                  size="sm"
                  onClick={() => onRestore(session)}
                  className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl gap-2 font-bold px-4"
                  title="Return to conversion flow"
                >
                  <RefreshCcw className="w-4 h-4" />
                  {session.status === "Uploaded" ? "Re-convert" : "Restore"}
                </Button>
              )}

              {(session.status === "Ready" || session.status?.includes("Ready")) && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPst(session)}
                    className="border-green-200 text-green-700 hover:bg-green-50 rounded-xl gap-2 font-bold px-4"
                    title="Download converted PST file directly"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRestore(session)}
                    className="text-zinc-500 hover:text-zinc-900 border border-zinc-200/50 hover:bg-zinc-50 rounded-xl gap-2 font-bold px-4"
                    title="View file structure"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View
                  </Button>
                </div>
              )}

              {["Converting", "Exporting", "Assembling"].includes(session.status) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    try {
                      const token = await getToken();
                      await fetch(`/api/sessions/${session.sessionId}/cancel`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                      toast.success("Cancel request sent");
                      fetchHistory();
                    } catch (err) {
                      toast.error("Failed to cancel");
                    }
                  }}
                  className="rounded-xl text-orange-400 hover:text-orange-600 hover:bg-orange-50"
                  title="Cancel active operation"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(session.sessionId)}
                className="rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50"
                title="Delete history entry"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversionHistory;
