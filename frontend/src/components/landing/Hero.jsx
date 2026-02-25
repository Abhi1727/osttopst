import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { fileService } from "../../services/fileService";
import { conversionService } from "../../services/conversionService";
import { checkDuplicate } from "../../services/api";
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
  Upload,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import conversionVideo from "../../assets/Website_Color_Scheme_and_Video.mp4";

const Hero = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState(null); // 'uploading' | 'processing' | 'complete'
  const [uploadDetail, setUploadDetail] = useState("");
  const [completedSession, setCompletedSession] = useState(null);
  const [abortController, setAbortController] = useState(null);

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

  const calculateFingerprint = async (file) => {
    // Fingerprint: SHA-256 of first 1MB + File Size
    const chunkSize = 1024 * 1024; // 1MB
    const slice = file.slice(0, chunkSize);
    const buffer = await slice.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `${hashHex}_${file.size}`;
  };

  const handleConvert = async () => {
    if (!file) return;

    const controller = new AbortController();
    setAbortController(controller);
    setUploading(true);
    setUploadPhase("uploading");
    uploadActive.current = true;

    try {
      const initialToken = await getToken();
      if (!initialToken) {
        console.warn("[Hero] No token found! Authentication might be missing.");
      }

      // Pre-upload optimization: Check for duplicates
      setUploadDetail("Checking for existing conversions...");
      try {
        const fingerprint = await calculateFingerprint(file);
        console.log("[Hero] Calculated fingerprint:", fingerprint);
        const dupResult = await checkDuplicate(fingerprint, initialToken);
        if (dupResult.found) {
          if (dupResult.isPaid) {
            toast.success("Lifetime access detected! No upload needed.");
            setUploadDetail("Redirecting to your paid conversion...");
          } else {
            toast.success("Previous conversion found! Resuming...");
          }

          setCompletedSession(dupResult.session);
          setUploadPhase("complete");

          setTimeout(() => {
            if (onUploadComplete) onUploadComplete(dupResult.session);
          }, 1500);
          return;
        }
      } catch (dupErr) {
        console.warn("[Hero] Duplicate check failed (skipping):", dupErr);
      }

      // We reuse the existing fileService.uploadFile logic, passing the getToken function
      // so it can refresh the token if it expires during a long upload
      const result = await fileService.uploadFile(
        file,
        getToken,
        (info) => {
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
        },
        null,
        controller.signal,
      );

      if (uploadActive.current) {
        console.log("[Hero] Upload/Conversion result received:", result);
        setCompletedSession(result);
        setUploadPhase("complete");

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
      if (err.message === "Upload cancelled") {
        console.log("[Hero] Upload/Conversion cancelled by user");
        return; // handleCancel already reset the state
      }
      console.error("[Hero] Upload/Conversion failed:", err);
      toast.error(err.message || "Conversion failed");
      setUploading(false);
      setUploadPhase("idle"); // Reset to allow retry
    } finally {
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      uploadActive.current = false;
      setUploading(false);
      setUploadPhase("idle");
      setProgress(0);
      setUploadDetail("");
      toast.info("Upload cancelled");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const item = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, item)).toFixed(1)} ${["B", "KB", "MB", "GB"][item]}`;
  };

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 lg:px-12 bg-white flex flex-col items-center min-h-[700px] justify-center">
      <div className="w-full max-w-6xl bg-white rounded-[40px] shadow-2xl shadow-emerald-500/10 border border-slate-100 p-4 md:p-6 flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
        {/* Left Side: Video Content */}
        <div className="w-full md:w-1/2 bg-[#E1F1FF] rounded-[30px] overflow-hidden relative flex items-center justify-center min-h-[350px]">
          <video
            src={conversionVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain p-6 md:p-10"
          />
        </div>

        {/* Right Side: Upload Interaction */}
        <div
          {...getRootProps()}
          className={`
            w-full md:w-1/2 border-2 border-dashed rounded-[30px] p-8 md:p-12
            flex flex-col items-center justify-center text-center
            transition-all duration-300 relative
            ${isDragActive ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 bg-white shadow-inner shadow-slate-50/30"}
            ${uploading || completedSession ? "pointer-events-none" : "hover:border-emerald-400 group cursor-pointer"}
          `}
        >
          <input {...getInputProps()} />

          {/* Default/Idle State */}
          {!uploading && !completedSession && (
            <div className="space-y-6 flex flex-col items-center">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-slate-800">
                  Upload your OST File
                </h2>
                <p className="text-slate-400 text-sm font-medium">
                  Preview Converted OST file in few simple steps
                </p>
              </div>

              {/* Upload Icon Container */}
              <div className="relative mt-8 mb-4">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10">
                  <FileText className="w-12 h-12 text-slate-400" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-full shadow-lg border border-slate-50 flex items-center justify-center z-20">
                  <UploadCloud className="w-6 h-6 text-emerald-500" />
                </div>
                {/* Decorative glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full -z-0"></div>
              </div>

              {/* Action Area */}
              {!file ? (
                <div className="flex flex-col items-center gap-4 w-full">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSignedIn) {
                        clerk.openSignIn();
                      } else {
                        open();
                      }
                    }}
                    className="w-full max-w-[280px] h-14 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-emerald-500/20 group-hover:scale-[1.02] transition-transform"
                  >
                    Upload OST File
                  </Button>

                  <div className="space-y-1 mt-4">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                      5GB upload file size limit
                    </p>
                    <p className="text-[10px] text-slate-400">
                      By Uploading the OST file you agree to our{" "}
                      <a href="#" className="underline hover:text-emerald-600">
                        Privacy Policy
                      </a>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      For Unlimited size use{" "}
                      <a
                        href="#"
                        className="text-rose-500 font-bold hover:underline"
                      >
                        Desktop Software
                      </a>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-emerald-100">
                    <File className="w-5 h-5 text-emerald-600" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800 max-w-[200px] truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full max-w-[320px]">
                    <Button
                      onClick={handleConvert}
                      className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20"
                    >
                      Convert Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="w-14 h-14 rounded-2xl border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                    >
                      <RotateCw className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Uploading State */}
          {uploading && !completedSession && (
            <div className="w-full space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800">
                  {uploadPhase === "processing"
                    ? "Processing File"
                    : "Uploading File"}
                </h3>
                <p className="text-slate-400 text-sm">
                  {uploadDetail || "Preparing your conversion..."}
                </p>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-600">
                    {progress}% Complete
                  </span>
                  {uploadPhase === "processing" ? (
                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                  ) : (
                    <RotateCw className="w-4 h-4 text-emerald-500 animate-spin" />
                  )}
                </div>
                <Progress
                  value={progress}
                  className="h-3 bg-slate-100 rounded-full"
                  indicatorClassName="bg-gradient-to-r from-emerald-500 to-emerald-400"
                />
              </div>

              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className="text-rose-500 hover:bg-rose-50 h-10 px-8 font-bold text-xs uppercase tracking-widest rounded-full"
              >
                Cancel Conversion
              </Button>
            </div>
          )}

          {/* Complete State */}
          {completedSession && (
            <div className="w-full space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800">
                  Conversion Ready!
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  Your file has been successfully processed
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-w-[280px] mx-auto">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Items Recovered
                </p>
                <p className="text-xl font-black text-emerald-600">
                  {completedSession.messageCount || "All Ready"}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <Lock className="w-3 h-3" />
                Secure 256-bit Encrypted
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
