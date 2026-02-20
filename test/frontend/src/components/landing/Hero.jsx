import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { fileService } from "../../services/fileService";
import { conversionService } from "../../services/conversionService";
import { toast } from "sonner";
import {
  FileText,
  Loader2,
  CheckCircle2,
  RotateCw,
  File,
  UploadCloud,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Hero = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState(null); // 'uploading' | 'processing' | 'complete'
  const [uploadDetail, setUploadDetail] = useState("");
  const [completedSession, setCompletedSession] = useState(null);

  const { getToken } = useAuth();
  const uploadActive = useRef(false);

  const { isSignedIn } = useAuth();
  const clerk = useClerk();

  // Initial file drop handler - just sets the file, doesn't upload yet
  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      if (!isSignedIn) {
        clerk.openSignIn();
        return;
      }

      if (fileRejections.length > 0) {
        toast.error("Only .pst and .ost files are supported.");
        return;
      }

      const selectedFile = acceptedFiles[0];
      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop().toLowerCase();
        if (ext !== "pst" && ext !== "ost") {
          toast.error("Only .pst and .ost files are supported.");
          return;
        }
        setFile(selectedFile);
        setUploadPhase("idle");
      }
    },
    [isSignedIn, clerk],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true, // We have a specific Browse button
    multiple: false,
    accept: {
      "application/vnd.ms-outlook": [".pst", ".ost"],
      "application/octet-stream": [".pst", ".ost"],
    },
    disabled: uploading || !!completedSession,
  });

  const handleConvert = async () => {
    if (!file) return;

    setUploading(true);
    setUploadPhase("uploading");
    uploadActive.current = true;

    try {
      const initialToken = await getToken();
      if (!initialToken) {
        console.warn("[Hero] No token found! Authentication might be missing.");
      }

      // We reuse the existing fileService.uploadFile logic, passing the getToken function
      // so it can refresh the token if it expires during a long upload
      const result = await fileService.uploadFile(file, getToken, (info) => {
        if (!uploadActive.current) return;

        if (typeof info === "object") {
          // Map service phases to UI phases
          // Service: init -> uploading -> finalizing -> complete
          if (info.phase === "finalizing") {
            setUploadPhase("processing");
            setUploadDetail("Finalizing conversion...");
          } else if (info.phase === "complete") {
            setUploadPhase("complete");
          } else {
            setUploadPhase("uploading");
            setUploadDetail(info.detail);
          }
          setProgress(info.percent || 0);
        } else {
          setProgress(info);
        }
      });

      if (uploadActive.current) {
        console.log("[Hero] Upload/Conversion result received:", result);
        setCompletedSession(result);
        setUploadPhase("complete");

        /* Auto-trigger removed - user will select export options in Preview page */

        // Auto-notify parent after a short delay
        console.log("[Hero] Notifying parent component in 1.5s...");
        setTimeout(() => {
          if (onUploadComplete) {
            console.log("[Hero] Calling onUploadComplete with result...");
            onUploadComplete(result);
          } else {
            console.warn("[Hero] onUploadComplete prop is missing!");
          }
        }, 1500);
      }
    } catch (err) {
      console.error("[Hero] Upload/Conversion failed:", err);
      toast.error(err.message || "Conversion failed");
      setUploading(false);
      setUploadPhase("idle"); // Reset to allow retry
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const item = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, item)).toFixed(1)} ${["B", "KB", "MB", "GB"][item]}`;
  };

  return (
    <section className="py-12 md:py-16 px-4 md:px-6 lg:px-12 bg-slate-50/50 flex flex-col items-center">
      <div className="text-center max-w-4xl mb-8 md:mb-12 space-y-4">
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Convert OST to PST <span className="text-emerald-600">Securely</span>
          <br className="hidden md:block" />
          <span className="text-emerald-600">& Instantly</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          The most reliable tool to recover and convert Outlook Offline Data
          files into accessible PST format without any data loss or metadata
          corruption.
        </p>
      </div>

      {/* Main Conversion Card */}
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-100 p-2 overflow-hidden">
        {/* Dropzone Area */}
        <div
          {...getRootProps()}
          className={`
                m-6 border-2 border-dashed rounded-2xl p-10 
                flex flex-col items-center justify-center gap-4 text-center
                transition-colors duration-200
                ${isDragActive ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 bg-slate-50/30"}
                ${uploading || completedSession ? "opacity-50 pointer-events-none" : ""}
            `}
        >
          <input {...getInputProps()} />

          {!file ? (
            <>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                <FileText className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Drag and drop your .ost file here
              </h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                Max file size: 50GB
              </p>

              <Button
                variant="outline"
                className="mt-4 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                onClick={() => {
                  if (!isSignedIn) {
                    clerk.openSignIn();
                  } else {
                    open();
                  }
                }}
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                Browse File
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                <File className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {file.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {!uploading && !completedSession && (
                <Button
                  variant="ghost"
                  className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    open();
                  }}
                >
                  Change File
                </Button>
              )}
            </>
          )}
        </div>

        {/* Upload/Conversion Options & Progress Area */}
        <div className="px-8 pb-8">
          {/* Options - Only show if file selected and not yet complete */}
          {file && !completedSession && !uploading && (
            <div className="flex flex-col items-center justify-center gap-6 border-t border-slate-100 pt-8 animate-fade-in">
              <Button
                size="lg"
                onClick={handleConvert}
                className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-10 py-6 text-lg rounded-2xl"
              >
                <RotateCw className="w-5 h-5 mr-3" />
                Convert Now
              </Button>
            </div>
          )}

          {/* Progress State */}
          {uploading && !completedSession && (
            <div className="border-t border-slate-100 pt-8 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {uploadPhase === "processing" ? (
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  )}
                  <span className="font-semibold text-slate-700">
                    {uploadPhase === "processing"
                      ? "Finalizing Conversion..."
                      : `Converting ${file.name}...`}
                  </span>
                </div>
                <span className="font-bold text-amber-500">{progress}%</span>
              </div>
              <Progress
                value={progress}
                className="h-2 bg-slate-100"
                indicatorClassName={
                  uploadPhase === "processing"
                    ? "bg-amber-400"
                    : "bg-emerald-500"
                }
              />
              <p className="text-xs text-slate-400 mt-2 text-center">
                {uploadDetail ||
                  "Converting mail items, attachments, and calendar entries..."}
              </p>
            </div>
          )}

          {/* Complete State */}
          {completedSession && (
            <div className="border-t border-slate-100 pt-8 animate-fade-in flex flex-col items-center">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-bold text-slate-800">
                    Conversion Successful!
                  </h4>
                  <p className="text-sm text-slate-500 font-medium">
                    {completedSession.originalFileName || file?.name} (
                    {file ? formatFileSize(file.size) : ""})
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full text-center">
                <p className="text-sm text-slate-600 mb-1">
                  Your converted file is ready.
                </p>
                <p className="text-xs text-slate-400">
                  Total items: {completedSession.messageCount || "All"}
                </p>
              </div>
            </div>
          )}

          {/* Footer Note within card */}
          {(uploading || completedSession) && (
            <div className="flex justify-center mt-6">
              <span className="text-[10px] text-slate-300 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                256-bit SSL Encrypted Connection
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
