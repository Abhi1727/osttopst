import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Mail,
  Loader2,
  Search,
  X,
  FileText,
  Menu,
  LayoutDashboard,
  User,
  Upload,
  Eye,
  ArrowLeft,
  Check,
  CloudUpload,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { fileService } from "../services/fileService";
import OstViewerLanding from "./OstViewerLanding";
import UpgradeModal from "./landing/pricingpop";

// ─── Tree Node ───────────────────────────────────────────────────────────────

const TreeNode = ({ node, level = 0, onSelect, selectedId, onDepthChange }) => {
  const [isOpen, setIsOpen] = useState(node.isOpen || node.level < 2);
  const hasChildren = node.subFolders && node.subFolders.length > 0;
  const isSelected = selectedId === node.folderId;

  const totalCount = useMemo(() => {
    const sum = (n) =>
      (n.messageCount || 0) +
      (n.subFolders ? n.subFolders.reduce((acc, c) => acc + sum(c), 0) : 0);
    return sum(node);
  }, [node]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    onDepthChange?.(level + 1, next);
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
        <span
          className={`w-4 h-4 flex-shrink-0 flex items-center justify-center transition-transform duration-200 ${
            isSelected ? "text-brand-500" : "text-slate-400"
          } ${isOpen && hasChildren ? "rotate-90" : ""}`}
        >
          {hasChildren && <ChevronRight size={14} />}
        </span>
        <span className={`flex-shrink-0 ${isSelected ? "text-brand-500" : "text-brand-400/70"}`}>
          {isOpen ? <FolderOpen size={15} /> : <Folder size={15} />}
        </span>
        <span
          className={`flex-1 min-w-0 text-[13px] font-semibold truncate ${
            isSelected ? "text-brand-500" : "text-slate-700"
          }`}
        >
          {node.displayName}
        </span>
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

// ─── Message Detail ───────────────────────────────────────────────────────────

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
          Choose an email from the list to view its contents and metadata.
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
                  <span className="text-brand-600">{message.to || "Unknown"}</span>
                </div>
              </div>
            </div>
          </div>

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
                    className="group p-5 rounded-[1.5rem] bg-white border border-slate-200 hover:border-brand-600/30 hover:shadow-xl hover:shadow-brand-500/5 transition-all flex items-center gap-5"
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

// ─── Upload Phase ─────────────────────────────────────────────────────────────

const UploadPhase = ({ onSessionReady }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      const ext = file.name.split(".").pop().toLowerCase();
      if (!["ost", "pst"].includes(ext)) {
        toast.error("Only .ost and .pst files are supported.");
        return;
      }

      const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
      if (file.size > MAX_SIZE) {
        setShowUpgradeModal(true);
        return;
      }

      setUploading(true);
      setProgress({ phase: "init", percent: 0, detail: "Initializing..." });

      try {
        const result = await fileService.uploadFile(
          file,
          null,
          (info) => setProgress(info),
          null,
          null,
          null,
        );
        onSessionReady({
          sessionId: result.sessionId,
          originalFileName: result.originalFileName || file.name,
          size: file.size,
        });
      } catch (err) {
        toast.error("Upload failed: " + err.message);
        setUploading(false);
        setProgress(null);
      }
    },
    [onSessionReady],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50/30 min-h-screen px-4">
      {/* Header branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 mb-12"
      >
        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-xl shadow-brand-500/30">
          <Eye size={24} className="text-white" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            OST Viewer
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Preview without converting
          </div>
        </div>
      </motion.div>

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-2xl"
      >
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={cn(
            "relative group border-2 border-dashed rounded-[2.5rem] p-16 text-center transition-all duration-300 cursor-pointer bg-white shadow-xl shadow-slate-200/50",
            isDragging
              ? "border-brand-500 bg-brand-50/50 scale-[1.01]"
              : "border-slate-200 hover:border-brand-400 hover:bg-brand-50/20",
            uploading && "pointer-events-none cursor-default",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".ost,.pst"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-20 h-20">
                <div className="w-20 h-20 rounded-full border-4 border-brand-100" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"
                  style={{ animationDuration: "0.8s" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-brand-600">
                    {progress?.percent ?? 0}%
                  </span>
                </div>
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 mb-1">
                  {progress?.phase === "init" && "Initializing..."}
                  {progress?.phase === "uploading" && "Uploading file..."}
                  {progress?.phase === "finalizing" && "Processing..."}
                  {progress?.phase === "complete" && "Almost ready!"}
                </div>
                <div className="text-sm text-slate-400 font-medium">
                  {progress?.detail}
                </div>
              </div>
              <div className="w-full max-w-xs bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress?.percent ?? 0}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div
                className={cn(
                  "w-20 h-20 rounded-[1.5rem] flex items-center justify-center transition-all duration-300",
                  isDragging
                    ? "bg-brand-500 text-white shadow-2xl shadow-brand-500/30 scale-110"
                    : "bg-slate-100 text-slate-400 group-hover:bg-brand-500 group-hover:text-white group-hover:shadow-xl group-hover:shadow-brand-500/20",
                )}
              >
                <CloudUpload size={36} />
              </div>

              <div>
                <div className="text-2xl font-black text-slate-900 mb-2">
                  {isDragging ? "Drop to preview" : "Drop your file here"}
                </div>
                <div className="text-slate-400 font-medium text-sm">
                  or{" "}
                  <span className="text-brand-500 font-bold underline underline-offset-4">
                    click to browse
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {[".OST", ".PST"].map((ext) => (
                  <span
                    key={ext}
                    className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {[
            "No account required",
            "Preview only — no export",
            "100% private",
          ].map((label) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm"
            >
              <Check size={12} className="text-emerald-500" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                {label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
};

// ─── Preview Phase ────────────────────────────────────────────────────────────

const PreviewPhase = ({ session, onReset, getToken }) => {
  const [folders, setFolders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [maxOpenDepth, setMaxOpenDepth] = useState(0);
  const [sortBy] = useState("date");
  const [sortOrder] = useState("desc");

  const totalMessageCount = useMemo(() => {
    const sum = (list) =>
      list.reduce(
        (acc, f) => acc + (f.messageCount || 0) + sum(f.subFolders || []),
        0,
      );
    return sum(folders);
  }, [folders]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const freshToken = await getToken();
        const data = await fileService.getFolders(session.sessionId, freshToken, true);
        setFolders(data || []);
      } catch (err) {
        toast.error("Failed to load folders");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session.sessionId, getToken]);

  const handleFolderSelect = async (folder) => {
    setSelectedFolder(folder);
    setSelectedMessage(null);
    try {
      setLoadingMessages(true);
      const freshToken = await getToken();
      const data = await fileService.getMessages(
        session.sessionId,
        folder.folderId,
        freshToken,
        {},
        sortBy,
        sortOrder,
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
    if (!msg) { setSelectedMessage(null); return; }
    setSelectedMessage(msg);
    try {
      setLoadingDetail(true);
      const freshToken = await getToken();
      const detail = await fileService.getMessageDetail(
        session.sessionId,
        msg.entryId,
        freshToken,
      );
      setSelectedMessage(detail);
    } catch (err) {
      toast.error("Failed to load message content");
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.subject?.toLowerCase().includes(q) ||
        m.from?.toLowerCase().includes(q) ||
        m.to?.toLowerCase().includes(q),
    );
  }, [messages, searchQuery]);

  return (
    <div className="flex-1 bg-white flex flex-col min-h-0 overflow-hidden relative font-sans selection:bg-brand-100 selection:text-brand-900">
      <div className="flex-1 flex flex-col min-h-0 relative z-10 bg-white overflow-hidden">
        {/* Title Bar */}
        <div className="h-14 bg-white flex items-center px-4 md:px-6 justify-between shrink-0 select-none border-b border-slate-100">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="md:hidden w-10 h-10 p-0 rounded-xl"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={20} className="text-slate-600" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Eye size={14} className="text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                OST Viewer
              </span>
            </div>
          </div>

          <div className="flex-1 flex justify-center px-4">
            <div className="flex items-center bg-slate-50 rounded-xl px-5 py-2 w-full max-w-xl text-[12px] text-slate-400 border border-slate-200/50 group hover:border-brand-200 transition-all focus-within:ring-2 focus-within:ring-brand-100 focus-within:bg-white">
              <Search size={14} className="mr-4 text-slate-300 group-hover:text-brand-400 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages, senders..."
                className="bg-transparent border-none outline-none w-full text-slate-700 placeholder:text-slate-300 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-100 rounded-full">
              <Eye size={10} className="text-violet-500" />
              <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">
                Preview Mode
              </span>
            </div>
            <Button
              variant="ghost"
              className="w-9 h-9 p-0 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              onClick={onReset}
              title="Upload new file"
            >
              <ArrowLeft size={18} />
            </Button>
          </div>
        </div>

        {/* Info Bar */}
        <div className="h-12 border-b border-slate-100 flex items-center px-4 md:px-8 bg-gradient-to-r from-slate-50 to-white shrink-0 gap-6">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={14} className="text-brand-400 shrink-0" />
            <span className="text-[12px] font-bold text-slate-600 truncate max-w-[220px]">
              {session.originalFileName}
            </span>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {session.size
              ? (session.size / (1024 * 1024)).toFixed(1) + " MB"
              : "---"}
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {totalMessageCount} items
          </div>
        </div>

        {/* Three-pane layout */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-white">
          {/* Sidebar */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-100 flex flex-col py-6 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:z-0",
              isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
            )}
            style={{ width: `${Math.min(160 + (maxOpenDepth + 1) * 48, 340)}px` }}
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
                  <Loader2 className="animate-spin text-brand-500/50" size={32} />
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
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        selectedFolder === null
                          ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                          : "bg-slate-100 group-hover:bg-slate-200"
                      }`}
                    >
                      <LayoutDashboard size={14} />
                    </div>
                    <span className="ml-4 text-[13px] font-bold">Overview</span>
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

            {/* File info card */}
            <div className="mt-8 px-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-slate-900 truncate">
                      {session.originalFileName || "Session Data"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      Source Archive
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold py-2 border-t border-slate-50">
                  <span className="text-slate-400 uppercase tracking-widest">File Size</span>
                  <span className="text-slate-700">
                    {session.size
                      ? (session.size / (1024 * 1024)).toFixed(1) + " MB"
                      : "---"}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Message List */}
          <div
            className={cn(
              "w-full md:w-[380px] lg:w-[420px] border-r border-slate-100 flex flex-col bg-white shrink-0 overflow-hidden transition-all duration-300",
              selectedMessage ? "hidden lg:flex" : "flex",
            )}
          >
            <div className="p-8 pb-6 bg-white shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {selectedFolder ? selectedFolder.displayName : "Inbox"}
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
                {totalMessageCount} items total
              </p>
            </div>

            <ScrollArea className="flex-1">
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6 text-slate-200">
                  <Loader2 className="animate-spin text-brand-400" size={40} />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Loading folder...
                  </span>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-16 text-center flex flex-col items-center gap-8">
                  <div className="w-24 h-24 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200">
                    <Inbox size={40} className="opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-extrabold text-slate-900">
                      {selectedFolder ? "No messages found" : "Select a folder"}
                    </div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-widest font-bold leading-relaxed">
                      {selectedFolder
                        ? "Try adjusting your search"
                        : "Pick a folder from the sidebar to browse emails"}
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
                        <span
                          className={`text-[15px] font-bold truncate transition-colors ${
                            selectedMessage?.entryId === msg.entryId
                              ? "text-brand-500"
                              : "text-slate-900"
                          }`}
                        >
                          {msg.from || "Unknown Sender"}
                        </span>
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
                        className={`text-[13px] mb-2 font-bold truncate leading-snug ${
                          selectedMessage?.entryId === msg.entryId
                            ? "text-slate-900"
                            : "text-slate-600"
                        }`}
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

          {/* Detail Pane */}
          <div
            className={cn(
              "flex-1 bg-white flex flex-col min-w-0 relative",
              !selectedMessage && "hidden md:flex",
            )}
          >
            {selectedFolder === null ? (
              <ScrollArea className="flex-1 bg-white">
                <div className="p-16 max-w-4xl mx-auto space-y-16">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="w-16 h-16 rounded-[2rem] bg-brand-500 flex items-center justify-center text-white shadow-2xl shadow-brand-500/30 mb-8">
                      <Eye size={30} />
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.05]">
                      Preview
                      <br />
                      <span className="text-brand-500">Overview</span>
                    </h2>
                    <p className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed">
                      File loaded successfully.{" "}
                      <span className="text-slate-900 font-bold underline decoration-brand-200 underline-offset-8">
                        {session.originalFileName}
                      </span>
                      . Select a folder to start browsing emails.
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        label: "Items Found",
                        value: totalMessageCount,
                        icon: Mail,
                        color: "text-brand-500",
                        bg: "bg-brand-100/50",
                      },
                      {
                        label: "Total Folders",
                        value: folders.length,
                        icon: Folder,
                        color: "text-violet-500",
                        bg: "bg-violet-100/50",
                      },
                      {
                        label: "File Size",
                        value: session.size
                          ? (session.size / (1024 * 1024)).toFixed(1) + " MB"
                          : "---",
                        icon: FileText,
                        color: "text-emerald-500",
                        bg: "bg-emerald-100/50",
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group relative overflow-hidden"
                      >
                        <div
                          className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform`}
                        >
                          <stat.icon size={24} />
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

                  <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
                    <div className="px-10 py-8 border-b border-slate-100">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-1">
                        Folder Structure
                      </h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">
                        Top-level directories
                      </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {folders.slice(0, 10).map((f, i) => (
                        <div
                          key={i}
                          onClick={() => handleFolderSelect(f)}
                          className="flex items-center justify-between px-10 py-6 hover:bg-slate-50 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-500 group-hover:text-white transition-all shadow-sm">
                              <Folder size={18} />
                            </div>
                            <div className="space-y-0.5">
                              <div className="font-extrabold text-[14px] text-slate-800 group-hover:text-brand-500 transition-colors">
                                {f.displayName}
                              </div>
                              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                Mailbox Folder
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-black text-slate-900">
                                {f.messageCount || 0}
                              </div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                Items
                              </div>
                            </div>
                            <ChevronRight
                              size={16}
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
                    <Loader2 className="animate-spin text-brand-600" size={40} />
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
    </div>
  );
};

// ─── Main OstViewer ───────────────────────────────────────────────────────────

const OstViewer = () => {
  const [session, setSession] = useState(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const { openSignIn } = useClerk();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // Get auth token when user is authenticated
  useEffect(() => {
    const fetchToken = async () => {
      if (user && isLoaded) {
        try {
          const token = await getToken();
          setAuthToken(token);
        } catch (err) {
          console.error("Failed to get auth token:", err);
        }
      }
    };
    fetchToken();
  }, [user, isLoaded, getToken]);

  const handleSessionReady = useCallback((sessionData) => {
    // If not loaded, store session and wait - the useEffect below will clear the prompt if user is found
    if (!isLoaded) {
      setSession(sessionData);
      return;
    }

    if (!user) {
      setSession(sessionData);
      setShowSignInPrompt(true);
      return;
    }

    setSession(sessionData);
    setShowSignInPrompt(false);
  }, [isLoaded, user]);

  const handleReset = useCallback(() => {
    setSession(null);
    setShowSignInPrompt(false);
  }, []);

  const handleSignInComplete = useCallback(() => {
    // After sign-in, proceed to preview with stored session
    setShowSignInPrompt(false);
  }, []);

  // Auto-clear sign-in prompt if user becomes available
  useEffect(() => {
    if (isLoaded && user && showSignInPrompt) {
      setShowSignInPrompt(false);
    }
  }, [isLoaded, user, showSignInPrompt]);

  // If session is set but auth wasn't loaded, check again once loaded
  useEffect(() => {
    if (isLoaded && session && !user && !showSignInPrompt) {
      setShowSignInPrompt(true);
    }
  }, [isLoaded, session, user, showSignInPrompt]);

  return (
    <AnimatePresence mode="wait">
      {showSignInPrompt && session && !user ? (
        <motion.div
          key="signin-prompt"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 px-4"
        >
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 mx-auto mb-6">
              <Eye size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">Sign in to browse</h2>
            <p className="text-slate-500 font-medium mb-8">
              Please sign in to preview and browse your file's contents.
            </p>
            <button
              onClick={() => {
                openSignIn({ afterSignInUrl: window.location.pathname });
              }}
              className="px-6 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/30"
            >
              Sign in now
            </button>
          </div>
        </motion.div>
      ) : null}
      {session && user ? (
        <motion.div
          key="preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col min-h-0"
        >
          <PreviewPhase session={session} onReset={handleReset} getToken={getToken} />
        </motion.div>
      ) : (
        <motion.div
          key="upload"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col min-h-0"
        >
          <OstViewerLanding onSessionReady={handleSessionReady} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OstViewer;
