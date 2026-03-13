import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Mail,
  Loader2,
  Check,
  Download,
  ArrowLeft,
  Search,
  Rocket,
  Trash2,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ExportDialog from "./ExportDialog";
import { useAuth, useUser } from "@clerk/clerk-react";
import { fileService } from "../services/fileService";
import licenseService from "../services/licenseService";
import { toast } from "sonner";
import SessionGuardModal from "./SessionGuardModal";
import logo from "@/assets/logo.png";
import { useCallback, useRef } from "react";

const TreeNode = ({ node, level = 0, onSelect, selectedId }) => {
  const [isOpen, setIsOpen] = useState(node.isOpen || node.level < 2);
  const hasChildren = node.subFolders && node.subFolders.length > 0;
  const isSelected = selectedId === node.folderId;

  const totalCount = useMemo(() => {
    const sum = (n) =>
      (n.messageCount || 0) +
      (n.subFolders
        ? n.subFolders.reduce((acc, child) => acc + sum(child), 0)
        : 0);
    return sum(node);
  }, [node]);

  return (
    <div>
      <div
        className={`flex items-center py-2.5 px-3 cursor-pointer rounded-xl transition-all group mb-1 ${
          isSelected
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100 ring-2 ring-emerald-600/20"
            : "hover:bg-zinc-100/80 text-zinc-600"
        }`}
        style={{ marginLeft: `${level * 16}px` }}
        onClick={() => {
          onSelect(node);
          if (hasChildren) setIsOpen(!isOpen);
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`w-4 h-4 flex items-center justify-center transition-transform duration-200 ${
              isSelected ? "text-white/70" : "text-zinc-400"
            } ${isOpen ? "rotate-90" : ""}`}
          >
            {hasChildren && <ChevronRight size={14} />}
          </span>
          <span
            className={`flex-shrink-0 ${isSelected ? "text-white" : "text-zinc-400"}`}
          >
            <Folder
              size={18}
              fill={isSelected ? "rgba(255,255,255,0.2)" : "currentColor"}
              className={`${isSelected ? "" : "opacity-40"} transition-all`}
            />
          </span>
          <span
            className={`text-[13px] font-bold truncate ${isSelected ? "text-white" : "text-zinc-700"}`}
          >
            {node.displayName}
          </span>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-1.5 ml-2">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isSelected
                  ? "bg-white/20 text-white"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-100"
              }`}
            >
              {totalCount}
            </span>
          </div>
        )}
      </div>
      {isOpen && hasChildren && (
        <div className="relative ml-[15px]">
          <div className="absolute left-[8px] top-0 bottom-3 w-[1.5px] bg-zinc-100" />
          {node.subFolders.map((child) => (
            <TreeNode
              key={child.folderId}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FilePreview = ({ session, onReset }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [folders, setFolders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [isGuardOpen, setIsGuardOpen] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filter, setFilter] = useState({ year: null, month: null });
  const [licenseLimit, setLicenseLimit] = useState(-1);
  const [licenseTier, setLicenseTier] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchLicense = async () => {
      if (!user) return;
      try {
        const token = await getToken();
        const email = user?.primaryEmailAddress?.emailAddress;
        const data = await licenseService.getLicenseStatus(token, email);
        if (data) {
          let tierStr = "";
          if (data.tier !== undefined) tierStr = String(data.tier);
          else if (data.Tier !== undefined) tierStr = String(data.Tier);

          if (tierStr === "1" || tierStr.toLowerCase() === "demo")
            setLicenseTier("Demo");
          else if (tierStr === "2" || tierStr.toLowerCase() === "demoexpired")
            setLicenseTier("Demo Expired");
          else if (tierStr === "3" || tierStr.toLowerCase() === "professional")
            setLicenseTier("Professional");
          else setLicenseTier(tierStr);

          if (data.exportFileLimit !== undefined) {
            setLicenseLimit(data.exportFileLimit);
          } else if (data.ExportFileLimit !== undefined) {
            setLicenseLimit(data.ExportFileLimit);
          }
        }
      } catch (err) {
        console.error("Failed to fetch license", err);
      }
    };
    fetchLicense();
  }, [getToken, user]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => {
        if (!isExportDialogOpen) {
          setIsGuardOpen(true);
        }
      },
      10 * 60 * 1000,
    ); // 10 minutes
  }, [isExportDialogOpen]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];
    const handleActivity = () => resetTimer();

    events.forEach((e) => window.addEventListener(e, handleActivity));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  useEffect(() => {
    // Push state to intercept back button
    window.history.pushState(null, null, window.location.pathname);

    const handlePopState = () => {
      window.history.pushState(null, null, window.location.pathname);
      setIsGuardOpen(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Removed automatic purgeSession on beforeunload to prevent race conditions with downloads/navigation.
  // The backend CleanupBackgroundService will handle stale sessions.
  const purgeSession = useCallback(async () => {
    if (!session?.sessionId) return;

    const confirm = window.confirm(
      "Are you sure you want to discard this conversion? This will delete all files and reset your progress.",
    );
    if (!confirm) return;

    try {
      const toastId = toast.loading("Deleting session...");
      const token = await getToken();
      await fileService.deleteSession(session.sessionId, token);
      toast.dismiss(toastId);
      toast.success("Session deleted successfully");
      console.log(
        "[FilePreview] Manual cleanup triggered for:",
        session.sessionId,
      );
      onReset();
    } catch (err) {
      toast.error("Failed to delete session: " + err.message);
      console.error("[FilePreview] Manual cleanup failed:", err);
    }
  }, [getToken, session?.sessionId, onReset]);

  // Intentionally removed beforeunload listener to prevent race conditions during downloads.
  // Explicit cleanup is still handled by the "Back to Upload" button.

  const totalMessageCount = useMemo(() => {
    const sumMessages = (folderList) => {
      let total = 0;
      folderList.forEach((f) => {
        total += f.messageCount || 0;
        if (f.subFolders) {
          total += sumMessages(f.subFolders);
        }
      });
      return total;
    };
    return sumMessages(folders);
  }, [folders]);

  useEffect(() => {
    console.log("[FilePreview] current session:", session);
  }, [session]);

  const handleConversion = async () => {
    try {
      setIsConverting(true);
      const ext = (session.originalFileName || session.fileName || "")
        .split(".")
        .pop()
        .toLowerCase();

      if (ext === "ost") {
        await conversionService.convertToPst(
          session.sessionId,
          getToken,
          true,
          null,
          null,
          user?.primaryEmailAddress?.emailAddress,
        );
        toast.success("Starting PST conversion...");
      }
    } catch (err) {
      toast.error("Conversion failed: " + err.message);
    } finally {
      setIsConverting(false);
    }
  };

  const loadFolders = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const data = await fileService.getFolders(
        session.sessionId,
        token,
        hideEmpty,
      );
      setFolders(data || []);
      // Auto-select overview initially
      setSelectedFolder(null);
    } catch (err) {
      toast.error("Failed to load folders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.sessionId) {
      loadFolders();
    }
  }, [hideEmpty, session?.sessionId]);

  const handleFolderSelect = async (
    folder,
    currentSortBy = sortBy,
    currentSortOrder = sortOrder,
    currentFilter = filter,
  ) => {
    setSelectedFolder(folder);
    setSelectedMessages(new Set()); // Reset selection when folder changes
    try {
      setLoadingMessages(true);
      const token = await getToken();
      const data = await fileService.getMessages(
        session.sessionId,
        folder.folderId,
        token,
        currentFilter,
        currentSortBy,
        currentSortOrder,
      );
      setMessages(data || []);
    } catch (err) {
      toast.error("Failed to load messages");
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSort = (newSortBy) => {
    const newOrder =
      sortBy === newSortBy && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(newSortBy);
    setSortOrder(newOrder);
    if (selectedFolder) {
      handleFolderSelect(selectedFolder, newSortBy, newOrder, filter);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);
    if (selectedFolder) {
      handleFolderSelect(selectedFolder, sortBy, sortOrder, newFilter);
    }
  };

  const toggleMessageSelection = (entryId) => {
    // Read the current set synchronously, outside the updater.
    const isSelected = selectedMessages.has(entryId);

    if (isSelected) {
      // Deselection: always allowed, no toast.
      setSelectedMessages((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
      return;
    }

    // Adding: check limit first, before touching state.
    if (licenseLimit !== -1 && selectedMessages.size >= licenseLimit) {
      const tierInfo = licenseTier ? ` (${licenseTier} plan)` : "";
      toast.dismiss();
      toast.error(
        `You can only select ${licenseLimit} items ${tierInfo}. Please upgrade your plan to select more.`,
      );
      return;
    }

    setSelectedMessages((prev) => {
      const next = new Set(prev);
      next.add(entryId);
      return next;
    });
  };

  const handleExport = async (format) => {
    try {
      const toastId = toast.loading(`Preparing ${format} export...`);
      const token = await getToken();
      await fileService.exportAll(
        session.sessionId,
        format,
        true,
        token,
        user?.primaryEmailAddress?.emailAddress,
      );
      toast.dismiss(toastId);
      toast.success("Export successful!");
    } catch (err) {
      toast.dismiss();
      toast.error("Export failed: " + err.message);
    }
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.subject?.toLowerCase().includes(query) ||
        m.from?.toLowerCase().includes(query) ||
        m.to?.toLowerCase().includes(query),
    );
  }, [messages, searchQuery]);

  const isAllSelectedInView =
    filteredMessages.length > 0 &&
    filteredMessages.every((m) => selectedMessages.has(m.entryId));

  const hasAnySelectedInView =
    filteredMessages.length > 0 &&
    filteredMessages.some((m) => selectedMessages.has(m.entryId));

  const toggleSelectAll = () => {
    if (hasAnySelectedInView) {
      // CLEAR Mode: remove all visible items — no limit check needed.
      setSelectedMessages((prev) => {
        const next = new Set(prev);
        for (const m of filteredMessages) {
          next.delete(m.entryId);
        }
        return next;
      });
    } else {
      // SELECT Mode: check limit before adding.
      if (licenseLimit !== -1) {
        let newItemsCount = 0;
        for (const m of filteredMessages) {
          if (!selectedMessages.has(m.entryId)) newItemsCount++;
        }

        if (
          filteredMessages.length > licenseLimit ||
          selectedMessages.size + newItemsCount > licenseLimit
        ) {
          const tierInfo = licenseTier ? ` (${licenseTier} plan)` : "";
          toast.dismiss();
          toast.error(
            `You can only select up to ${licenseLimit} items ${tierInfo}. Please manually select items or upgrade your plan.`,
          );
          return;
        }
      }

      setSelectedMessages((prev) => {
        const next = new Set(prev);
        for (const m of filteredMessages) {
          next.add(m.entryId);
        }
        return next;
      });
    }
  };

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 gap-4">
        <Loader2 className="animate-spin text-zinc-300" size={48} />
        <h2 className="text-xl font-bold text-zinc-400 uppercase tracking-widest">
          Waiting for session...
        </h2>
        <Button
          variant="ghost"
          className="font-bold text-zinc-500"
          onClick={onReset}
        >
          Cancel and go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden border-t border-zinc-100">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Navigation */}
        <aside className="w-[380px] border-r border-zinc-100 flex flex-col bg-zinc-50/30 shrink-0">
          <div className="p-6 border-b border-zinc-100 flex items-center gap-4 bg-white">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-100 shrink-0">
              <img
                src={logo}
                alt="Logo"
                className="w-7 h-7 object-contain brightness-0 invert"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-zinc-900 tracking-tight text-sm truncate">
                {session?.originalFileName ||
                  session?.fileName ||
                  session?.FileName ||
                  "Archive View"}
              </span>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.1em] mt-0.5">
                {(
                  session?.fileType ||
                  session?.FileType ||
                  "OUTLOOK"
                ).toUpperCase()}{" "}
                DATA FILE
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 px-4 py-8">
            {loading ? (
              <div className="flex flex-col items-center py-12 gap-3 text-zinc-400">
                <Loader2 className="animate-spin" size={32} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Scanning folders...
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visibility Toggle */}
                <div className="px-1 mb-4">
                  <button
                    onClick={() => setHideEmpty(!hideEmpty)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl border transition-all",
                      hideEmpty
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                        : "bg-white border-zinc-100 text-zinc-500 hover:bg-zinc-50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          hideEmpty ? "bg-emerald-500" : "bg-zinc-300",
                        )}
                      />
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        Hide System folders
                      </span>
                    </div>
                    {hideEmpty && <Check size={14} strokeWidth={3} />}
                  </button>
                </div>

                <div
                  className={`flex items-center py-3 px-4 cursor-pointer rounded-2xl transition-all border ${
                    selectedFolder === null
                      ? "bg-emerald-50 border-emerald-100 text-emerald-900 shadow-sm"
                      : "bg-white border-zinc-100 hover:bg-zinc-50 text-zinc-600"
                  }`}
                  onClick={() => setSelectedFolder(null)}
                >
                  <Rocket
                    size={20}
                    className={
                      selectedFolder === null
                        ? "text-emerald-500"
                        : "text-zinc-400"
                    }
                  />
                  <span className="ml-3 text-sm font-black tracking-tight">
                    Data File Overview
                  </span>
                  {folders.length > 0 && (
                    <span className="ml-auto bg-zinc-100 text-zinc-500 text-[10px] font-black px-2 py-1 rounded-lg border border-zinc-200/50">
                      {folders.length} Root
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {folders.map((node) => (
                    <TreeNode
                      key={node.folderId}
                      node={node}
                      onSelect={handleFolderSelect}
                      selectedId={selectedFolder?.folderId}
                    />
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="p-6 bg-white border-t border-zinc-100">
            <div className="bg-zinc-50 rounded-2xl p-5 flex items-center gap-4 border border-zinc-100/50">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-zinc-100 text-zinc-400">
                <Folder size={20} />
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-black text-zinc-900 tracking-tight">
                  {session?.size || session?.Size
                    ? ((session.size || session.Size) / (1024 * 1024)).toFixed(
                        1,
                      ) + " MB"
                    : "Calculated"}
                </div>
                <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                  {folders.length} Root Items
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Panel: Content Preview */}
        <main className="flex-1 flex flex-col bg-white">
          {!selectedFolder ? (
            <ScrollArea className="flex-1 bg-zinc-50/20">
              <div className="p-12 max-w-5xl mx-auto space-y-12">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
                    Archive Breakdown
                  </h2>
                  <p className="text-zinc-500 font-bold">
                    Comprehensive view of your Outlook data file structure and
                    contents.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      label: "Total Messages",
                      value: totalMessageCount,
                      icon: Mail,
                      color: "bg-blue-500",
                    },
                    {
                      label: "Folders Detected",
                      value: folders.length,
                      icon: Folder,
                      color: "bg-emerald-500",
                    },
                    {
                      label: "File Size",
                      value:
                        session?.size || session?.Size
                          ? (
                              (session.size || session.Size) /
                              (1024 * 1024)
                            ).toFixed(1) + " MB"
                          : "---",
                      icon: Check,
                      color: "bg-amber-500",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div
                        className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-${stat.color.split("-")[1]}-100`}
                      >
                        <stat.icon size={24} />
                      </div>
                      <div className="text-3xl font-black text-zinc-900 mb-1">
                        {stat.value}
                      </div>
                      <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-[40px] border border-zinc-100 shadow-sm overflow-hidden">
                  <div className="px-10 py-8 border-b border-zinc-100 bg-zinc-50/50">
                    <h3 className="font-black text-zinc-900 tracking-tight">
                      Root Folders Analysis
                    </h3>
                  </div>
                  <div className="p-4">
                    {folders.map((f, i) => {
                      const rec_count = (n) =>
                        (n.messageCount || 0) +
                        (n.subFolders
                          ? n.subFolders.reduce(
                              (acc, c) => acc + rec_count(c),
                              0,
                            )
                          : 0);
                      const count = rec_count(f);
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-6 hover:bg-zinc-50/80 rounded-[24px] group transition-all"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                              <Folder size={24} />
                            </div>
                            <div>
                              <div className="font-black text-zinc-900">
                                {f.displayName}
                              </div>
                              <div className="text-xs font-bold text-zinc-400">
                                {f.subFolders?.length || 0} nested
                                subdirectories
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-black text-zinc-900">
                              {count}
                            </div>
                            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                              Messages
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <>
              {/* Top Toolbar */}
              <div className="h-24 px-10 border-b border-zinc-100 flex items-center justify-between gap-8 bg-white shrink-0">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-3 tracking-tight">
                    {selectedFolder?.displayName || "Select a folder"}
                    {filteredMessages.length > 0 && (
                      <span className="text-sm font-bold text-zinc-400 bg-zinc-50 px-3 py-1 rounded-full border border-zinc-100 shrink-0">
                        {filteredMessages.length} items
                      </span>
                    )}
                    {selectedMessages.size > 0 && (
                      <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 animate-in zoom-in-95 duration-200 shrink-0">
                        {selectedMessages.size} selected
                      </span>
                    )}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative group w-[300px]">
                    <Search
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400"
                      size={18}
                    />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search messages..."
                      className="pl-12 h-12 bg-zinc-50 border-none rounded-xl font-bold"
                    />
                  </div>

                  {/* Date Filters */}
                  <div className="flex items-center gap-2">
                    <select
                      value={filter.year || ""}
                      onChange={(e) =>
                        handleFilterChange(
                          "year",
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      className="h-12 px-4 rounded-xl border-none bg-zinc-50 font-bold text-sm text-zinc-600 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 25 }, (_, i) => 2026 - i).map(
                        (y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      value={filter.month || ""}
                      onChange={(e) =>
                        handleFilterChange(
                          "month",
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      className="h-12 px-4 rounded-xl border-none bg-zinc-50 font-bold text-sm text-zinc-600 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">Month</option>
                      {[
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ].map((m, i) => (
                        <option key={i + 1} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Content Table */}
              <ScrollArea className="flex-1">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-200">
                    <Loader2 className="animate-spin" size={48} />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                      Loading messages...
                    </span>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-400 p-20">
                    <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-100">
                      <Mail size={32} className="opacity-10" />
                    </div>
                    <div className="text-center max-w-xs">
                      <h3 className="font-bold text-zinc-900">
                        No content found
                      </h3>
                      <p className="text-[13px] leading-relaxed mt-1">
                        Select a folder from the sidebar or try a different
                        search term to see messages.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="min-w-full">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
                        <tr className="border-b border-zinc-100">
                          <th className="px-6 py-5 w-12">
                            <button
                              onClick={toggleSelectAll}
                              className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                hasAnySelectedInView && isAllSelectedInView
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : hasAnySelectedInView
                                    ? "bg-emerald-100 border-emerald-500 text-emerald-600"
                                    : "border-zinc-200 hover:border-emerald-500",
                              )}
                            >
                              {hasAnySelectedInView && isAllSelectedInView ? (
                                <Check size={12} strokeWidth={4} />
                              ) : hasAnySelectedInView ? (
                                <Minus size={12} strokeWidth={4} />
                              ) : null}
                            </button>
                          </th>
                          <th
                            className="px-10 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 transition-colors"
                            onClick={() => handleSort("from")}
                          >
                            <div className="flex items-center gap-1">
                              From
                              {sortBy === "from" && (
                                <ChevronDown
                                  className={cn(
                                    "w-3 h-3 transition-transform",
                                    sortOrder === "asc" && "rotate-180",
                                  )}
                                />
                              )}
                            </div>
                          </th>
                          <th
                            className="px-10 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 transition-colors"
                            onClick={() => handleSort("subject")}
                          >
                            <div className="flex items-center gap-1">
                              Subject
                              {sortBy === "subject" && (
                                <ChevronDown
                                  className={cn(
                                    "w-3 h-3 transition-transform",
                                    sortOrder === "asc" && "rotate-180",
                                  )}
                                />
                              )}
                            </div>
                          </th>
                          <th
                            className="px-10 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-widest text-right whitespace-nowrap cursor-pointer hover:text-emerald-600 transition-colors"
                            onClick={() => handleSort("date")}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Date
                              {sortBy === "date" && (
                                <ChevronDown
                                  className={cn(
                                    "w-3 h-3 transition-transform",
                                    sortOrder === "asc" && "rotate-180",
                                  )}
                                />
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {filteredMessages.map((msg) => (
                          <tr
                            key={msg.entryId}
                            onClick={() => toggleMessageSelection(msg.entryId)}
                            className={cn(
                              "group hover:bg-zinc-50/80 transition-all cursor-pointer relative",
                              selectedMessages.has(msg.entryId) &&
                                "bg-emerald-50/30",
                            )}
                          >
                            <td className="px-6 py-6 w-12">
                              <div
                                className={cn(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                  selectedMessages.has(msg.entryId)
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-zinc-200 group-hover:border-emerald-500",
                                )}
                              >
                                {selectedMessages.has(msg.entryId) && (
                                  <Check size={12} strokeWidth={4} />
                                )}
                              </div>
                            </td>
                            <td className="px-10 py-6 min-w-[250px]">
                              <div className="flex items-center gap-4">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-transparent group-hover:bg-emerald-200 transition-colors" />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[15px] font-black text-zinc-800 truncate">
                                    {msg.from || "Unknown"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <span className="text-[15px] font-bold text-zinc-600 leading-snug">
                                {msg.subject || "(No Subject)"}
                              </span>
                            </td>
                            <td className="px-10 py-6 text-right shrink-0">
                              <span className="text-[13px] font-black text-zinc-400 whitespace-nowrap">
                                {msg.date
                                  ? new Date(msg.date).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </main>
      </div>

      {/* Bottom Action Bar */}
      <footer className="h-28 px-12 border-t border-zinc-100 flex items-center justify-between bg-white shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              onReset();
            }}
            className="h-14 px-8 rounded-2xl border-2 border-zinc-100 text-zinc-500 font-black hover:bg-zinc-50 transition-all gap-3 group active:scale-95"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Keep & Back
          </Button>

          <Button
            variant="ghost"
            onClick={purgeSession}
            className="h-14 px-8 rounded-2xl text-red-400 font-bold hover:text-red-500 hover:bg-red-50 transition-all gap-3 active:scale-95"
          >
            <Trash2 size={20} />
            Discard Session
          </Button>
        </div>

        <div className="flex items-center gap-10">
          <div className="hidden xl:flex items-center gap-4 px-6 py-3 bg-emerald-50/50 border border-emerald-100/50 rounded-3xl">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
              <Check size={14} strokeWidth={4} />
            </div>
            <span className="text-sm font-black text-emerald-800 tracking-tight">
              Analysis Complete
            </span>
          </div>

          <Button
            onClick={() => setIsExportDialogOpen(true)}
            className="h-16 px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-[0_16px_32px_-12px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-1 active:scale-95 gap-4 group"
          >
            Export / Download
            <Rocket
              size={24}
              className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
            />
          </Button>
        </div>
      </footer>

      <ExportDialog
        open={isExportDialogOpen}
        session={session}
        onClose={() => setIsExportDialogOpen(false)}
        options={{
          folderId: selectedFolder?.folderId,
          entryIds:
            selectedMessages.size > 0 ? Array.from(selectedMessages) : null,
          year: filter.year,
          month: filter.month,
          excludeEmptyFolders: hideEmpty,
        }}
      />

      <SessionGuardModal
        isOpen={isGuardOpen}
        onClose={() => {
          setIsGuardOpen(false);
          resetTimer();
        }}
        onHome={onReset}
        onExport={() => {
          setIsGuardOpen(false);
          setIsExportDialogOpen(true);
        }}
      />
    </div>
  );
};

export default FilePreview;
