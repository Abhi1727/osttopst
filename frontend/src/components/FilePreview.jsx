import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Mail,
  Loader2,
  Check,
  ArrowLeft,
  Search,
  Rocket,
  Trash2,
  Archive,
  Printer,
  MoreHorizontal,
  X,
  FileText,
  FolderOpen,
  Menu,
  LayoutDashboard,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ExportDialog from "./ExportDialog";
import { useAuth, useUser } from "@clerk/clerk-react";
import { fileService } from "../services/fileService";
import licenseService from "../services/licenseService";
import { conversionService } from "../services/conversionService";
import { toast } from "sonner";
import SessionGuardModal from "./SessionGuardModal";
// logo import removed per user request for no images
import { motion, AnimatePresence } from "framer-motion";

const TreeNode = ({ node, level = 0, onSelect, selectedId, onDepthChange }) => {
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

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    // bubble depth change: children are at level + 1
    onDepthChange?.(level + 1, nextOpen);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 pr-4 cursor-pointer rounded-none transition-all group mb-0.5 ${
          isSelected
            ? "bg-brand-500/10 border-l-2 border-brand-500 text-brand-500"
            : "text-slate-600 hover:bg-slate-50 border-l-2 border-transparent"
        }`}
        style={{ paddingLeft: `${4 + level * 16}px` }}
        onClick={() => {
          onSelect(node);
          if (hasChildren) handleToggle();
        }}
      >
        {/* Chevron */}
        <span
          className={`w-4 h-4 flex-shrink-0 flex items-center justify-center transition-transform duration-200 ${
            isSelected ? "text-brand-500" : "text-slate-400"
          } ${isOpen && hasChildren ? "rotate-90" : ""}`}
        >
          {hasChildren && <ChevronRight size={14} />}
        </span>

        {/* Folder icon */}
        <span
          className={`flex-shrink-0 ${isSelected ? "text-brand-500" : "text-brand-400/70"}`}
        >
          {isOpen ? <FolderOpen size={15} /> : <Folder size={15} />}
        </span>

        {/* Name */}
        <span
          className={`flex-1 min-w-0 text-[13px] font-semibold truncate ${
            isSelected ? "text-brand-500" : "text-slate-700"
          }`}
        >
          {node.displayName}
        </span>

        {/* Badge */}
        {totalCount > 0 && (
          <span
            className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              isSelected
                ? "bg-brand-500/20 text-brand-500"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {totalCount}
          </span>
        )}
      </div>

      {/* Children */}
      {isOpen && hasChildren && (
        <div className="mt-0.5 space-y-0.5">
          {node.subFolders.map((child) => (
            <TreeNode
              key={child.folderId}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              onDepthChange={onDepthChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* Removed LicenseUsageBar component */

const MessageDetail = ({ message }) => {
  if (!message)
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-12 text-center bg-white border-l border-slate-200">
        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
          <Mail size={32} className="opacity-20 text-brand-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          Select an item to read
        </h3>
        <p className="max-w-xs mt-2 text-sm text-slate-500 leading-relaxed font-medium">
          Choose an email from the list to view its contents, attachments, and
          metadata.
        </p>
      </div>
    );

  const hasBody = message.bodyHtml || message.bodyText || message.body;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col min-w-0 h-full bg-white lg:border-l lg:border-slate-100"
    >
      {/* Message Header / Toolbar */}
      <div className="h-16 border-b border-slate-200 flex items-center px-8 justify-between shrink-0 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="h-9 gap-2 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl px-4 border border-slate-200/50 shadow-sm"
          >
            <Archive size={14} className="text-brand-500" /> Archive
          </Button>
          <Button
            variant="ghost"
            className="h-9 gap-2 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl px-4 border border-slate-200/50 shadow-sm"
          >
            <Printer size={14} className="text-slate-400" /> Print
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <Button
            variant="ghost"
            className="h-9 gap-2 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl px-4 border border-red-100/50 shadow-sm"
          >
            <Trash2 size={14} /> Delete
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="w-9 h-9 p-0 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          >
            <MoreHorizontal size={18} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-10 max-w-5xl mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight">
              {message.subject || "(No Subject)"}
            </h1>

            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 p-4 sm:p-6 bg-slate-50/50 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center bg-slate-100">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[15px] font-bold text-slate-900 truncate">
                    {message.from || "Unknown Sender"}
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-lg">
                    {message.date
                      ? new Date(message.date).toLocaleString([], {
                          dateStyle: "long",
                          timeStyle: "short",
                        })
                      : ""}
                  </div>
                </div>
                <div className="text-xs text-slate-500 truncate flex items-center gap-2 font-medium">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                    Recipient:
                  </span>
                  <span className="text-brand-600">
                    {message.to || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium min-h-[400px]">
            {hasBody ? (
              message.bodyHtml ? (
                <div dangerouslySetInnerHTML={{ __html: message.bodyHtml }} />
              ) : (
                <div className="whitespace-pre-wrap">
                  {message.bodyText || message.body}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-4">
                <FileText size={48} className="opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest opacity-40">
                  No preview available
                </p>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {message.attachments?.length > 0 && (
            <div className="mt-16 pt-10 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Attachments
                </h3>
                <div className="flex-1 h-px bg-slate-50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {message.attachments.map((att, i) => (
                  <div
                    key={i}
                    className="group p-5 rounded-[1.5rem] bg-white border border-slate-200 hover:border-brand-600/30 hover:shadow-xl hover:shadow-brand-500/5 transition-all cursor-pointer flex items-center gap-5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-brand-600 group-hover:text-white flex items-center justify-center transition-all">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {att.fileName}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1">
                        {(att.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
};

const FilePreview = ({ session, onReset }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [folders, setFolders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
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
  const [licenseStatus, setLicenseStatus] = useState(null);
  const timerRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Track max nesting depth of open folders so the sidebar can flex its width
  const [maxOpenDepth, setMaxOpenDepth] = useState(0);

  useEffect(() => {
    const fetchLicense = async () => {
      if (!user) return;
      try {
        const token = await getToken();
        const email = user?.primaryEmailAddress?.emailAddress;
        const itemId = session?.originalFileName
          ? `${session.originalFileName}${session.size}`
          : null;
        const data = await licenseService.getLicenseStatus(
          token,
          email,
          itemId,
        );
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
          setLicenseStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch license", err);
      }
    };
    fetchLicense();
  }, [getToken, user]);

  // Prevent page refresh during active operations
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isConverting) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isConverting]);

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
    setSelectedMessage(null); // Reset detail view
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

  const handleMessageSelect = async (msg) => {
    if (!msg) {
      setSelectedMessage(null);
      return;
    }

    // Set basic info first for immediate UI response
    setSelectedMessage(msg);

    try {
      setLoadingDetail(true);
      const token = await getToken();
      const detail = await fileService.getMessageDetail(
        session.sessionId,
        msg.entryId,
        token,
      );
      // Update with full detail (including body and attachments)
      setSelectedMessage(detail);
    } catch (err) {
      toast.error("Failed to load message content");
      console.error(err);
    } finally {
      setLoadingDetail(false);
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
    <div className="flex-1 bg-white flex flex-col min-h-0 overflow-hidden relative font-sans selection:bg-brand-100 selection:text-brand-900 px-0">
      <AnimatePresence>
        {isGuardOpen && (
          <SessionGuardModal
            isOpen={true}
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
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-h-0 relative z-10 bg-white overflow-hidden">
        {/* Modern Title Bar (Light) */}
        <div className="h-14 bg-white flex items-center px-4 md:px-6 justify-between shrink-0 select-none border-b border-slate-100">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="md:hidden w-10 h-10 p-0 rounded-xl"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={20} className="text-slate-600" />
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                File Preview
              </span>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="flex items-center bg-slate-50 rounded-xl px-5 py-2 w-full max-w-xl text-[12px] text-slate-400 border border-slate-200/50 group hover:border-brand-200 transition-all focus-within:ring-2 focus-within:ring-brand-100 focus-within:bg-white">
              <Search
                size={14}
                className="mr-4 text-slate-300 group-hover:text-brand-400 transition-colors"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages, senders, or attachments..."
                className="bg-transparent border-none outline-none w-full text-slate-700 placeholder:text-slate-300 font-medium"
              />
            </div>
          </div>

          <div className="hidden md:flex w-32 justify-end items-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="h-auto md:h-20 border-b border-slate-100 flex flex-col md:flex-row items-center px-4 md:px-10 py-4 md:py-0 justify-between bg-white shrink-0 gap-4">
          <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-10">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="w-10 h-10 p-0 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                onClick={onReset}
                title="Back to Upload"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block" />
              <Button
                variant="ghost"
                className="w-10 h-10 p-0 rounded-xl text-slate-300 hover:text-red-500 transition-all"
                onClick={purgeSession}
                title="Discard Session"
              >
                <Trash2 size={18} />
              </Button>
            </div>

            <Button
              onClick={() => setIsExportDialogOpen(true)}
              className="h-10 md:h-12 bg-brand-500 hover:bg-brand-600 rounded-xl md:rounded-2xl text-white flex items-center gap-2 md:gap-3 text-xs md:text-sm font-bold px-4 md:px-8 transition-all shadow-lg shadow-brand-500/30"
            >
              <Rocket size={16} />{" "}
              <span className="hidden sm:inline">Export Results</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">
                Session ID
              </div>
              <div className="text-xs font-bold text-slate-400 font-mono">
                {session?.sessionId?.substring(0, 8).toUpperCase() || "---"}
              </div>
            </div>
          </div>
        </div>

        {/* Main content three-pane layout */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-white">
          {/* Sidebar - width expands with open folder depth */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-100 flex flex-col py-6 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:z-0",
              isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
            )}
            style={{
              width: `${Math.min(160 + (maxOpenDepth + 1) * 48, 340)}px`,
            }}
          >
            {isSidebarOpen && (
              <Button
                variant="ghost"
                className="absolute top-4 right-4 md:hidden w-8 h-8 p-0 rounded-full"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X size={16} />
              </Button>
            )}
            <div className="mb-6 px-4 flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">
                Navigation
              </span>
            </div>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex flex-col items-center py-20 gap-4 text-slate-300">
                  <Loader2
                    className="animate-spin text-brand-500/50"
                    size={32}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Indexing data...
                  </span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div
                    className={`mx-2 flex items-center py-3 px-3 cursor-pointer rounded-2xl transition-all border group ${
                      selectedFolder === null
                        ? "bg-white border-slate-200 text-brand-500 shadow-sm"
                        : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                    onClick={() => setSelectedFolder(null)}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selectedFolder === null ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "bg-slate-100 group-hover:bg-slate-200"}`}
                    >
                      <LayoutDashboard size={14} />
                    </div>
                    <span className="ml-4 text-[13px] font-bold">
                      Dashboard
                    </span>
                  </div>

                  <div className="space-y-1">
                    {folders.map((node) => (
                      <TreeNode
                        key={node.folderId}
                        node={node}
                        onSelect={handleFolderSelect}
                        selectedId={selectedFolder?.folderId}
                        onDepthChange={(depth, isOpen) => {
                          setMaxOpenDepth((prev) =>
                            isOpen
                              ? Math.max(prev, depth)
                              : depth > 0
                                ? Math.max(0, prev - 1)
                                : prev,
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Sidebar Info Cards */}
            <div className="mt-8 space-y-4 px-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-slate-900 truncate">
                      {session?.originalFileName || "Session Data"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      Source Archive
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold py-2 border-t border-slate-50">
                  <span className="text-slate-400 uppercase tracking-widest">
                    File Size
                  </span>
                  <span className="text-slate-700">
                    {session?.size
                      ? (session.size / (1024 * 1024)).toFixed(1) + " MB"
                      : "---"}
                  </span>
                </div>
              </div>

              {/* Wrapped LicenseUsageBar removed */}
            </div>
          </aside>

          {/* Email List Pane */}
          <div
            className={cn(
              "w-full md:w-[380px] lg:w-[420px] border-r border-slate-100 flex flex-col bg-white shrink-0 overflow-hidden transition-all duration-300",
              selectedMessage ? "hidden lg:flex" : "flex",
            )}
          >
            {/* List Header/Filter */}
            <div className="p-8 pb-6 bg-white shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Inbox
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="h-8 px-3 rounded-lg text-brand-600 hover:bg-brand-50 font-bold text-[10px] uppercase tracking-widest"
                  >
                    All <ChevronDown size={12} className="ml-1" />
                  </Button>
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {totalMessageCount} items stored
              </p>
            </div>

            <ScrollArea className="flex-1">
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6 text-slate-200">
                  <Loader2 className="animate-spin text-brand-400" size={40} />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Loading inbox...
                  </span>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-16 text-center flex flex-col items-center gap-8">
                  <div className="w-24 h-24 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200">
                    <Mail size={40} className="opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-extrabold text-slate-900">
                      No messages found
                    </div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-widest font-bold leading-relaxed">
                      Try adjusting your filters or selecting a different folder
                    </div>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredMessages.map((msg) => (
                    <div
                      key={msg.entryId}
                      onClick={() => handleMessageSelect(msg)}
                      className={`p-8 cursor-pointer transition-all relative group border-l-[3px] ${
                        selectedMessage?.entryId === msg.entryId
                          ? "bg-brand-50/50 border-brand-500 shadow-[inset_0_0_20px_rgba(14,165,233,0.03)]"
                          : "hover:bg-slate-50/80 border-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3 gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMessageSelection(msg.entryId);
                            }}
                            className={`w-5 h-5 rounded-lg border-2 transition-all shrink-0 flex items-center justify-center ${
                              selectedMessages.has(msg.entryId)
                                ? "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20"
                                : "border-slate-200 group-hover:border-slate-300 hover:border-brand-500"
                            }`}
                          >
                            {selectedMessages.has(msg.entryId) && (
                              <Check size={12} strokeWidth={4} />
                            )}
                          </button>
                          <span
                            className={`text-[15px] font-bold truncate transition-colors ${selectedMessage?.entryId === msg.entryId ? "text-brand-500" : "text-slate-900"}`}
                          >
                            {msg.from || "Unknown Sender"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 mt-1 font-extrabold uppercase bg-slate-100 px-2 py-1 rounded-md">
                          {msg.date
                            ? new Date(msg.date).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                      <div
                        className={`text-[13px] mb-2 font-bold truncate leading-snug ${selectedMessage?.entryId === msg.entryId ? "text-slate-900" : "text-slate-600"}`}
                      >
                        {msg.subject || "(No Subject)"}
                      </div>
                      <div className="text-[12px] text-slate-400 line-clamp-2 leading-relaxed font-medium">
                        {msg.body?.substring(0, 120) ||
                          "No content preview available for this item..."}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div
            className={cn(
              "flex-1 bg-white flex flex-col min-w-0 relative",
              !selectedMessage && "hidden md:flex",
            )}
          >
            {selectedFolder === null ? (
              <ScrollArea className="flex-1 bg-white">
                {/* ... (Overview Dashboard remains the same) ... */}
                <div className="p-20 max-w-5xl mx-auto space-y-20">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="w-16 h-16 rounded-[2rem] bg-brand-500 flex items-center justify-center text-white shadow-2xl shadow-brand-500/30 mb-8 overflow-hidden group">
                      <Rocket
                        size={32}
                        className="group-hover:scale-125 transition-transform duration-500"
                      />
                    </div>
                    <h2 className="text-6xl font-black text-slate-900 tracking-tight leading-[1.05]">
                      Analytics
                      <br />
                      <span className="text-brand-500">Overview</span>
                    </h2>
                    <p className="text-slate-500 text-xl font-medium max-w-2xl leading-relaxed">
                      High-fidelity data extraction complete. Source:{" "}
                      <span className="text-slate-900 font-bold underline decoration-brand-200 underline-offset-8">
                        {session?.originalFileName}
                      </span>
                      . Select a directory to explore converted items.
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      {
                        label: "Items Extracted",
                        value: totalMessageCount,
                        icon: Mail,
                        color: "text-brand-500",
                        bg: "bg-brand-100/50",
                      },
                      {
                        label: "Total Folders",
                        value: folders.length,
                        icon: Folder,
                        color: "text-brand-500",
                        bg: "bg-brand-100/50",
                      },
                      {
                        label: "Storage Capacity",
                        value: session?.size
                          ? (session.size / (1024 * 1024)).toFixed(1) + " MB"
                          : "---",
                        icon: Check,
                        color: "text-brand-500",
                        bg: "bg-brand-100/50",
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group relative overflow-hidden"
                      >
                        <div
                          className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-8 transform group-hover:rotate-12 transition-transform`}
                        >
                          <stat.icon size={26} />
                        </div>
                        <div className="text-4xl font-black text-slate-900 mb-2">
                          {stat.value}
                        </div>
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-1">
                          Directory Structure
                        </h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">
                          Top level folder analysis
                        </p>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {folders.slice(0, 10).map((f, i) => (
                        <div
                          key={i}
                          onClick={() => handleFolderSelect(f)}
                          className="flex items-center justify-between px-12 py-8 hover:bg-slate-50 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-8">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-500 group-hover:text-white transition-all shadow-sm">
                              <Folder size={22} />
                            </div>
                            <div className="space-y-1">
                              <div className="font-extrabold text-[15px] text-slate-800 group-hover:text-brand-500 transition-colors">
                                {f.displayName}
                              </div>
                              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                Mailbox Sub-folder
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-lg font-black text-slate-900">
                                {f.messageCount || 0}
                              </div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                Items
                              </div>
                            </div>
                            <ChevronRight
                              size={18}
                              className="text-slate-200 group-hover:text-brand-500 group-hover:translate-x-1 transition-all"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="relative flex-1 flex flex-col min-w-0 h-full">
                {loadingDetail && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4">
                    <Loader2
                      className="animate-spin text-brand-600"
                      size={40}
                    />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Loading content...
                    </span>
                  </div>
                )}
                <MessageDetail message={selectedMessage} />
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default FilePreview;
