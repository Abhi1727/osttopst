import React, { useEffect, useState } from "react";
import {
  History,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  RefreshCcw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRecentSessions, deleteSession } from "../services/api";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";

const formatDistanceToNow = (date) => {
  const diffTime = Math.abs(new Date() - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "today";
  return `${diffDays} days ago`;
};

const ConversionHistory = ({ onRestore }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
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
  }, []);

  const handleDelete = async (sessionId) => {
    try {
      const token = await getToken();
      await deleteSession(sessionId, token);
      setSessions(sessions.filter((s) => s.sessionId !== sessionId));
      toast.success("Session deleted");
    } catch (err) {
      toast.error("Failed to delete session");
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCcw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );

  if (sessions.length === 0) {
    console.log("[ConversionHistory] No sessions found, returning null");
    return (
      <div className="text-center p-12 bg-white rounded-3xl border border-zinc-100 shadow-sm mt-12">
        <History className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
        <h3 className="font-bold text-zinc-900">No Recent Conversions</h3>
        <p className="text-zinc-500 text-sm">
          Upload a file to start your first conversion.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden mt-12">
      <div className="p-6 border-b border-zinc-50 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-emerald-600" />
          <h3 className="font-black text-zinc-900 tracking-tight">
            Recent Conversions
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchHistory}
          className="text-zinc-400 hover:text-zinc-600"
        >
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="divide-y divide-zinc-50">
        {sessions.map((session) => (
          <div
            key={session.sessionId}
            className="p-4 hover:bg-zinc-50/50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl ${session.status === "Uploaded" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-50 text-zinc-400"}`}
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
                        ? "bg-emerald-100 text-emerald-700"
                        : session.status === "Assembling"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {session.status === "Uploaded" && (
                <Button
                  size="sm"
                  onClick={() => onRestore(session)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold px-4"
                >
                  <Download className="w-4 h-4" />
                  Re-convert
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(session.sessionId)}
                className="rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50"
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
