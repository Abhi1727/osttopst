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
  Zap,
  Cloud,
  Gift,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import conversionVideo from "../../assets/Website_Color_Scheme_and_Video.mp4";
import ExportDialog from "../ExportDialog";

const Hero = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState(null); // 'uploading' | 'processing' | 'complete'
  const [uploadDetail, setUploadDetail] = useState("");
  const [completedSession, setCompletedSession] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

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
    // Fallback if crypto.subtle is unavailable (e.g. non-HTTPS local dev)
    if (!crypto || !crypto.subtle) {
      return `fallback_${file.name}_${file.size}_${file.lastModified}`;
    }

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
            if (info.activeSessionId && !activeSessionId) {
              setActiveSessionId(info.activeSessionId);
            }
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
      setActiveSessionId(null);
    } finally {
      setAbortController(null);
    }
  };

  const handleCancel = async () => {
    if (abortController) {
      abortController.abort();
      uploadActive.current = false;
      setUploading(false);
      setUploadPhase("idle");
      setProgress(0);
      setUploadDetail("");
      setFile(null);
      toast.info("Upload cancelled");

      // If we have an active session ID (it reached assembly phase), delete the session entirely.
      if (activeSessionId) {
        try {
          const token = await getToken();
          await fileService.deleteSession(activeSessionId, token);
          console.log(`[Hero] Deleted aborted session: ${activeSessionId}`);
        } catch (err) {
          console.warn(
            "[Hero] Failed to delete aborted session on server:",
            err,
          );
        }
        setActiveSessionId(null);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const item = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, item)).toFixed(1)} ${["B", "KB", "MB", "GB"][item]}`;
  };

  return (
    <section className="py-12 md:py-4 px-4 md:px-6 lg:px-12 bg-white flex flex-col items-center min-h-[600px] justify-center">
      {/* Main Heading & Tagline */}
      <div className="text-center mb-12 max-w-4xl mx-auto space-y-1">
        <h1 className="text-xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
          Convert OST to PST Online File For Free

        </h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed">
         An easy and free online method to convert OST to PST files instantly & securely.
        </p>
        {/* <div className="flex flex-wrap justify-center gap-3">
          <button className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-full border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 transition-colors text-sm font-medium shadow-sm">
            <Lock className="w-4 h-4 text-emerald-500" /> SSL Secured
          </button>
          <button className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-full border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 transition-colors text-sm font-medium shadow-sm">
            <Zap className="w-4 h-4 text-emerald-500" /> No Outlook Required
          </button>
          <button className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-full border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 transition-colors text-sm font-medium shadow-sm">
            <Cloud className="w-4 h-4 text-emerald-500" /> Cloud Based
          </button>
          <button className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-full border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 transition-colors text-sm font-medium shadow-sm">
            <Gift className="w-4 h-4 text-emerald-500" /> Free Conversion
          </button>
        </div> */}
      </div>

      <div className="w-full max-w-6xl bg-white rounded-[40px] shadow-2xl shadow-emerald-500/10 border border-slate-100 p-4 md:p-6 flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
        {/* Left Side: Video Content */}
        {!uploading && !completedSession && (
          <div className="w-full md:w-[45%] bg-gradient-to-br from-[#F0F7FF] via-[#E1F1FF] to-[#D0E8FF] rounded-[30px] overflow-hidden relative flex items-center justify-center border border-white/60 shadow-xl shadow-blue-500/5 group/video aspect-video md:aspect-auto">
            {/* Decorative Background Elements */}
            <div className="absolute top-1/4 -left-10 w-40 h-40 bg-blue-400/10 blur-[80px] rounded-full pointer-events-none group-hover/video:bg-blue-400/20 transition-colors duration-700"></div>
            <div className="absolute bottom-1/4 -right-10 w-40 h-40 bg-emerald-400/10 blur-[80px] rounded-full pointer-events-none group-hover/video:bg-emerald-400/20 transition-colors duration-700"></div>

            {/* Mirror Effect/Reflection */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none"></div>

            {/* Video Tag */}
            {/* <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white shadow-sm">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Live Preview
              </span>
            </div> */}

            <video
              src={conversionVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover relative z-10 opacity-95 group-hover/video:scale-[1.01] transition-transform duration-700 ease-out"
            />
          </div>
        )}

        {/* Right Side: Upload Interaction */}
        <div
          {...getRootProps()}
          className={`
            w-full ${uploading || completedSession ? "md:w-full" : "md:w-[55%]"} border-2 border-dashed rounded-[30px] p-8 md:p-12
            flex flex-col items-center justify-center text-center
            transition-all duration-300 relative
            ${isDragActive ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 bg-white shadow-inner shadow-slate-50/30"}
            ${uploading || completedSession ? "border-none bg-white shadow-none" : "hover:border-emerald-400 group cursor-pointer"}
          `}
        >
          <input
            {...getInputProps()}
            disabled={uploading || !!completedSession}
          />

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
                      50GB upload file size limit
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

          {/* Processing / Complete State */}
          {(uploading || completedSession) && (
            <div className="w-full animate-in fade-in duration-500 bg-white rounded-2xl p-2 md:p-6 text-center shadow-none md:shadow-sm">
              {/* Stepper Header */}
              <div className="flex justify-between items-start w-full max-w-lg mx-auto mb-10 relative">
                {/* Connecting Line */}
                <div className="absolute top-4 left-10 right-10 h-[2px] bg-slate-100 -z-10">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500 ease-in-out"
                    style={{
                      width: completedSession
                        ? "100%"
                        : uploadPhase === "processing" ||
                            uploadPhase === "complete"
                          ? "50%"
                          : "0%",
                    }}
                  ></div>
                </div>

                {/* Step 1: Upload */}
                <div className="flex flex-col items-center gap-2 bg-white px-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-emerald-100 text-emerald-600 shadow-sm border border-emerald-200">
                    1
                  </div>
                  <div className="flex items-center gap-1.5">
                    {uploadPhase === "uploading" ? (
                      <RotateCw className="w-4 h-4 text-emerald-500 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    <span className="text-xs font-bold text-slate-600">
                      File Uploaded
                    </span>
                  </div>
                </div>

                {/* Step 2: Convert */}
                <div className="flex flex-col items-center gap-2 bg-white px-2 z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors border ${
                      uploadPhase === "processing" ||
                      uploadPhase === "complete" ||
                      completedSession
                        ? "bg-emerald-100 text-emerald-600 border-emerald-200 shadow-sm"
                        : "bg-slate-50 text-slate-400 border-slate-100"
                    }`}
                  >
                    2
                  </div>
                  <div className="flex items-center gap-1.5">
                    {uploadPhase === "processing" && !completedSession ? (
                      <RotateCw className="w-4 h-4 text-emerald-500 animate-spin" />
                    ) : completedSession || uploadPhase === "complete" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : null}
                    <span
                      className={`text-xs font-bold ${
                        uploadPhase === "processing" ||
                        uploadPhase === "complete" ||
                        completedSession
                          ? "text-slate-600"
                          : "text-slate-400"
                      }`}
                    >
                      OST Converted
                    </span>
                  </div>
                </div>

                {/* Step 3: Preview */}
                <div className="flex flex-col items-center gap-2 bg-white px-2 z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors border ${
                      completedSession
                        ? "bg-emerald-100 text-emerald-600 border-emerald-200 shadow-sm"
                        : "bg-slate-50 text-slate-400 border-slate-100"
                    }`}
                  >
                    3
                  </div>
                  <div className="flex items-center gap-1.5">
                    {completedSession ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : null}
                    <span
                      className={`text-xs font-bold ${
                        completedSession ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      Preview & Save
                    </span>
                  </div>
                </div>
              </div>

              {/* File Info Card */}
              <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm mb-12 w-full text-left">
                <div className="flex items-center gap-6 w-full md:w-auto overflow-hidden">
                  {/* File Icon */}
                  <div className="w-14 h-16 bg-white border border-slate-200 rounded flex flex-col items-center justify-center shadow-sm shrink-0">
                    <span className="text-[10px] font-black text-emerald-600 leading-none mb-0.5">
                      OST
                    </span>
                    <File className="w-6 h-6 text-emerald-600" />
                  </div>

                  {/* File Details Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 lg:gap-x-8 gap-y-2 w-full text-left">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">
                        File Name:
                      </span>
                      <span
                        className="text-sm text-slate-500 truncate max-w-[120px]"
                        title={file?.name}
                      >
                        {file?.name || "Unknown"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">
                        File Size:
                      </span>
                      <span className="text-sm text-slate-500">
                        {file ? formatFileSize(file.size) : "-"}
                      </span>
                    </div>
                    <div className="flex flex-col lg:col-span-1 col-span-2">
                      <span className="text-xs font-bold text-slate-900">
                        File Format:
                      </span>
                      <span className="text-sm text-slate-500 truncate">
                        {file?.name?.split(".").pop() || "ost"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status / Progress on the right */}
                <div className="flex flex-col items-end shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  {completedSession ? (
                    <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                      File Converted Successfully.
                    </span>
                  ) : (
                    <div className="w-full md:w-48 flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-emerald-600">
                        {uploadPhase === "processing"
                          ? "Converting"
                          : "Uploading"}
                        ... {progress}%
                      </span>
                      <Progress
                        value={progress}
                        className="h-1.5 bg-slate-200 rounded-full w-full"
                        indicatorClassName="bg-gradient-to-r from-emerald-500 to-emerald-400 delay-100"
                      />
                      <span
                        className="text-[10px] text-slate-400 font-medium truncate w-full text-right"
                        title={uploadDetail}
                      >
                        {uploadDetail || "Processing..."}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Message / Actions */}
              {completedSession ? (
                <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center justify-center gap-2">
                    OST File Converted Successfully!!
                  </h3>
                  <p className="text-slate-600 text-sm md:text-[15px] font-medium leading-relaxed">
                    You can Download the converted file as per your requirement.
                    <br />
                    Select an option below to continue with your file.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExportDialogOpen(true);
                      }}
                      className="w-full sm:w-auto px-8 h-12 bg-white text-emerald-600 border-2 border-emerald-500 hover:bg-emerald-50 font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                      Export
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUploadComplete)
                          onUploadComplete(completedSession);
                      }}
                      className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                    >
                      Preview & Export
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel();
                    }}
                    className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-10 px-8 font-bold text-xs uppercase tracking-widest rounded-full relative z-50 pointer-events-auto cursor-pointer"
                  >
                    Cancel Conversion
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ExportDialog
        open={isExportDialogOpen}
        session={completedSession}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </section>
  );
};

export default Hero;
