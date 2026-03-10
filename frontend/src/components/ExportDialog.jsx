import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  Eye,
  FileText,
  Mail,
  Globe,
  FileCode,
  X,
  CheckCircle2,
  FolderX,
  ArrowRight,
  Loader2,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { conversionService } from "../services/conversionService";
import { deleteSession } from "../services/api";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

const EXPORT_FORMATS = [
  {
    id: "EML",
    label: "EML",
    description: "Standard email",
    icon: Mail,
    color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    iconColor: "text-blue-400",
  },
  {
    id: "MSG",
    label: "MSG",
    description: "Outlook format",
    icon: FileText,
    color: "from-violet-500/20 to-violet-600/10 border-violet-500/30",
    iconColor: "text-violet-400",
  },
  {
    id: "PDF",
    label: "PDF",
    description: "Adobe PDF",
    icon: FileText,
    color: "from-red-500/20 to-red-600/10 border-red-500/30",
    iconColor: "text-red-400",
  },
  {
    id: "DOCX",
    label: "DOCX",
    description: "Word Document",
    icon: FileText,
    color: "from-blue-700/20 to-blue-800/10 border-blue-700/30",
    iconColor: "text-blue-600",
  },
  {
    id: "HTML",
    label: "HTML",
    description: "Web page",
    icon: Globe,
    color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
  {
    id: "MBox",
    label: "MBox",
    description: "Unix mailbox",
    icon: FolderX,
    color: "from-rose-500/20 to-rose-600/10 border-rose-500/30",
    iconColor: "text-rose-400",
  },
  {
    id: "CSV",
    label: "CSV",
    description: "Spreadsheet",
    icon: FileText,
    color: "from-green-500/20 to-green-600/10 border-green-500/30",
    iconColor: "text-green-400",
  },
  {
    id: "XML",
    label: "XML",
    description: "Data format",
    icon: FileCode,
    color: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
    iconColor: "text-orange-400",
  },
  {
    id: "JSON",
    label: "JSON",
    description: "Modern data",
    icon: FileCode,
    color: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
    iconColor: "text-yellow-400",
  },
  {
    id: "TXT",
    label: "TXT",
    description: "Plain text",
    icon: FileText,
    color: "from-zinc-500/20 to-zinc-600/10 border-zinc-500/30",
    iconColor: "text-zinc-400",
  },
  {
    id: "RTF",
    label: "RTF",
    description: "Rich text",
    icon: FileText,
    color: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
    iconColor: "text-pink-400",
  },
  {
    id: "VCF",
    label: "VCF",
    description: "Contact card",
    icon: Rocket,
    color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
    iconColor: "text-cyan-400",
  },
  {
    id: "ICS",
    label: "ICS",
    description: "Calendar",
    icon: Rocket,
    color: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    iconColor: "text-purple-400",
  },
  {
    id: "EMLX",
    label: "EMLX",
    description: "Apple Mail",
    icon: Mail,
    color: "from-zinc-700/20 to-zinc-800/10 border-zinc-700/30",
    iconColor: "text-zinc-600",
  },
  {
    id: "Olm",
    label: "OLM",
    description: "Mac Outlook",
    icon: Mail,
    color: "from-blue-400/20 to-blue-500/10 border-blue-400/30",
    iconColor: "text-blue-300",
  },
  {
    id: "OFT",
    label: "OFT",
    description: "Outlook template",
    icon: FileText,
    color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
    iconColor: "text-indigo-400",
  },
  {
    id: "Zip",
    label: "ZIP",
    description: "Compressed",
    icon: Download,
    color: "from-zinc-400/20 to-zinc-500/10 border-zinc-400/30",
    iconColor: "text-zinc-400",
  },
  {
    id: "SevenZip",
    label: "7Z",
    description: "7-Zip archive",
    icon: Download,
    color: "from-zinc-600/20 to-zinc-700/10 border-zinc-600/30",
    iconColor: "text-zinc-500",
  },
];

const ExportDialog = ({ open, session, onClose, options = {} }) => {
  const [format, setFormat] = useState("EML");
  const [isExporting, setIsExporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [splitSizeMb, setSplitSizeMb] = useState("");
  const [splitFiles, setSplitFiles] = useState([]);
  const [progress, setProgress] = useState(null);
  const { getToken } = useAuth();
  const { user } = useUser();
  const abortControllerRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (!open || !session) return null;

  const handleCancel = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      toast.info("Conversion/Export cancelled.");

      // Notify server to cancel background task
      try {
        const token = await getToken();
        await conversionService.cancelOperation(session.sessionId, token);
      } catch (err) {
        console.warn("Failed to notify server of cancellation:", err);
      }
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      abortControllerRef.current = new AbortController();

      const savedName = await conversionService.exportAll(
        session.sessionId,
        format,
        options.excludeEmptyFolders ?? true,
        getToken,
        (p) => setProgress(p),
        abortControllerRef.current.signal,
        {
          folderId: options.folderId,
          entryIds: options.entryIds,
          year: options.year,
          month: options.month,
          startDate: options.startDate,
          endDate: options.endDate,
          email: user?.primaryEmailAddress?.emailAddress,
        },
      );
      if (savedName) {
        toast.success(`Export saved as: ${savedName}`);
      }
    } catch (err) {
      if (err.name === "AbortError" || err.message === "AbortError") {
        console.log("Export cancelled by user");
        return;
      }
      console.error(err);
      toast.error("Export failed: " + err.message);
    } finally {
      setIsExporting(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleConvert = async () => {
    try {
      setIsConverting(true);
      const filename = session.originalFileName || session.fileName || "";
      const ext = filename.split(".").pop().toLowerCase();

      if (ext !== "ost") return;

      abortControllerRef.current = new AbortController();

      const savedName = await conversionService.convertToPst(
        session.sessionId,
        getToken,
        true, // Default to excluding empty folders
        (p) => setProgress(p),
        abortControllerRef.current.signal,
        user?.primaryEmailAddress?.emailAddress,
        splitSizeMb ? Number(splitSizeMb) : null,
      );
      if (Array.isArray(savedName)) {
        setSplitFiles(savedName);
        toast.success(
          "File was split successfully! Please download the parts below.",
        );
      } else if (savedName) {
        toast.success(`Converted file saved as: ${savedName}`);
      }
    } catch (err) {
      if (err.name === "AbortError" || err.message === "AbortError") {
        console.log("Conversion cancelled by user");
        return;
      }
      toast.error("Conversion failed: " + err.message);
    } finally {
      setIsConverting(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  };

  const isOstSource = (session.originalFileName || session.fileName || "")
    .toLowerCase()
    .endsWith(".ost");

  const targetFormat = "PST";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-zinc-50 border-b border-zinc-100 p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-900">
                  Export Options
                </h2>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                  Choose your preferred download format
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSplitFiles([]);
                onClose();
              }}
              className="rounded-xl hover:bg-zinc-100 text-zinc-400"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="p-8 space-y-8">
            {splitFiles.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-600 mb-6">
                  <CheckCircle2 className="w-6 h-6" />
                  <h3 className="font-extrabold text-xl text-zinc-900">
                    Your Split Files Are Ready
                  </h3>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {splitFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FileText className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="font-bold text-zinc-700 text-sm truncate max-w-[250px]">
                          {file}
                        </span>
                      </div>
                      <Button
                        onClick={() =>
                          conversionService.downloadSplitFile(
                            session.sessionId,
                            file,
                            getToken,
                          )
                        }
                        className="bg-zinc-200 hover:bg-emerald-100 text-zinc-700 hover:text-emerald-700 rounded-xl px-4 py-2 font-black transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Direct Export Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-emerald-600">
                    <Mail className="w-5 h-5" />
                    <h3 className="font-extrabold text-lg text-zinc-900">
                      Direct Message Extraction
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {EXPORT_FORMATS.map((fmt) => {
                      const Icon = fmt.icon;
                      const isSelected = format === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          onClick={() => setFormat(fmt.id)}
                          disabled={isExporting}
                          className={cn(
                            "relative p-4 rounded-2xl border-2 transition-all text-left flex items-start gap-4",
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 shadow-md"
                              : "bg-white border-zinc-100 hover:border-zinc-200",
                          )}
                        >
                          <div
                            className={cn(
                              "p-2 rounded-xl shrink-0",
                              isSelected
                                ? "bg-emerald-600 text-white"
                                : "bg-zinc-50 text-zinc-400",
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <span
                              className={cn(
                                "text-sm font-black block tracking-tight",
                                isSelected
                                  ? "text-emerald-900"
                                  : "text-zinc-900",
                              )}
                            >
                              {fmt.label}
                            </span>
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                              {fmt.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={handleExport}
                      disabled={isExporting || isConverting}
                      className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl shadow-emerald-200 transition-all active:scale-[0.98] gap-3"
                    >
                      {isExporting ? (
                        <div className="flex flex-col items-center gap-1">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          {progress && (
                            <span className="text-[10px] font-bold opacity-80 uppercase tracking-tight">
                              {progress.detail}
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          <Download className="w-6 h-6" />
                          Download Zip File
                        </>
                      )}
                    </Button>
                    {isExporting && (
                      <Button
                        variant="ghost"
                        onClick={handleCancel}
                        className="w-full h-10 text-zinc-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel Export
                      </Button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-100"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-xs font-black text-zinc-300 uppercase tracking-[0.3em]">
                      OR
                    </span>
                  </div>
                </div>

                {/* Full Conversion Section */}
                {isOstSource && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-zinc-900">
                      <Rocket className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-extrabold text-lg">
                        Full Format Conversion
                      </h3>
                    </div>
                    <p className="text-sm font-bold text-zinc-500 leading-relaxed">
                      Download your entire data file fully converted to{" "}
                      <span className="text-emerald-600">{targetFormat}</span>{" "}
                      format, preserving all structure.
                    </p>
                    <div className="flex flex-col gap-2 mb-4">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Split Large File (Optional)
                      </label>
                      <select
                        value={splitSizeMb}
                        onChange={(e) => setSplitSizeMb(e.target.value)}
                        disabled={isConverting || isExporting}
                        className="w-full h-12 px-4 rounded-xl border-2 border-zinc-100 bg-zinc-50 focus:bg-white text-zinc-900 font-bold focus:border-emerald-500 transition-all outline-none"
                      >
                        <option value="">Don't Split (Single File)</option>
                        <option value="2000">Split into 2 GB chunks</option>
                        <option value="5000">Split into 5 GB chunks</option>
                        <option value="10000">Split into 10 GB chunks</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Button
                        onClick={handleConvert}
                        disabled={isConverting || isExporting}
                        variant="outline"
                        className="w-full h-16 rounded-2xl border-2 border-emerald-600 text-emerald-600 font-extrabold text-lg hover:bg-emerald-50 transition-all active:scale-[0.98] gap-3"
                      >
                        {isConverting ? (
                          <div className="flex flex-col items-center gap-1">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            {progress && (
                              <span className="text-[10px] font-bold opacity-80 uppercase tracking-tight">
                                {progress.detail}
                              </span>
                            )}
                          </div>
                        ) : (
                          <>
                            <Download className="w-6 h-6" />
                            Download Full {targetFormat} File
                          </>
                        )}
                      </Button>
                      {isConverting && (
                        <Button
                          variant="ghost"
                          onClick={handleCancel}
                          className="w-full h-10 text-zinc-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel Conversion
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportDialog;
