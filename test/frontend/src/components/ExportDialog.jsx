import React, { useState } from "react";
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
import { useAuth } from "@clerk/clerk-react";
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
    id: "HTML",
    label: "HTML",
    description: "Web page",
    icon: Globe,
    color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
  {
    id: "MHTML",
    label: "MHTML",
    description: "Web archive",
    icon: FileCode,
    color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    iconColor: "text-amber-400",
  },
];

const ExportDialog = ({ open, session, onClose }) => {
  const [format, setFormat] = useState("EML");
  const [isExporting, setIsExporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const { getToken } = useAuth();

  if (!open || !session) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const token = await getToken();
      await conversionService.exportAll(
        session.sessionId,
        format,
        false, // Default to including empty folders
        token,
      );
      toast.success("Export started! Check your downloads.");
    } catch (err) {
      console.error(err);
      toast.error("Export failed: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleConvert = async () => {
    try {
      setIsConverting(true);
      const token = await getToken();
      const filename = session.originalFileName || session.fileName || "";
      const ext = filename.split(".").pop().toLowerCase();

      if (ext === "ost") {
        await conversionService.convertToPst(
          session.sessionId,
          token,
          false, // Default to including empty folders
        );
        toast.success("Converting OST to PST...");
      } else {
        await conversionService.convertToOst(
          session.sessionId,
          token,
          false, // Default to including empty folders
        );
        toast.success("Converting PST to OST...");
      }
    } catch (err) {
      toast.error("Conversion failed: " + err.message);
    } finally {
      setIsConverting(false);
    }
  };

  const targetFormat = (session.originalFileName || session.fileName || "")
    .toLowerCase()
    .endsWith(".ost")
    ? "PST"
    : "OST";

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
              onClick={onClose}
              className="rounded-xl hover:bg-zinc-100 text-zinc-400"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="p-8 space-y-8">
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
                            isSelected ? "text-emerald-900" : "text-zinc-900",
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

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl shadow-emerald-200 transition-all active:scale-[0.98] gap-3"
              >
                {isExporting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Download className="w-6 h-6" />
                    Download Zip File
                  </>
                )}
              </Button>
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
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-900">
                <Rocket className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-lg">
                  Full Format Conversion
                </h3>
              </div>
              <p className="text-sm font-bold text-zinc-500 leading-relaxed">
                Download your entire data file fully converted to{" "}
                <span className="text-emerald-600">{targetFormat}</span> format,
                preserving all structure.
              </p>
              <Button
                onClick={handleConvert}
                disabled={isConverting}
                variant="outline"
                className="w-full h-16 rounded-2xl border-2 border-emerald-600 text-emerald-600 font-extrabold text-lg hover:bg-emerald-50 transition-all active:scale-[0.98] gap-3"
              >
                {isConverting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Download className="w-6 h-6" />
                    Download Full {targetFormat} File
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportDialog;
