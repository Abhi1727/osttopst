import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
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
  ShieldCheck,
  UserCheck,
  Clock,
  Headphones,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import conversionVideo from "../../assets/Website_Color_Scheme_and_Video.mp4";
import ExportDialog from "../ExportDialog";
import licenseService from "../../services/licenseService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { AlertTriangle } from "lucide-react";

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
  const [isDownloadingPst, setIsDownloadingPst] = useState(false);
  const [finishedPstDownload, setFinishedPstDownload] = useState(false);
  const [isStorageLimitDialogOpen, setIsStorageLimitDialogOpen] =
    useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  const { getToken } = useAuth();
  const uploadActive = useRef(false);
  const handleConvertRef = useRef(null);

  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const navigate = useNavigate();

  const [licenseStatus, setLicenseStatus] = useState(null);

  useEffect(() => {
    handleConvertRef.current = handleConvert;
  });

  useEffect(() => {
    const fetchLicense = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          const email = user?.primaryEmailAddress?.emailAddress;
          const data = await licenseService.getLicenseStatus(token, email);
          setLicenseStatus(data);
        } catch (err) {
          console.error("Failed to fetch license in Hero", err);
        }
      }
    };
    fetchLicense();
  }, [isSignedIn, getToken]);

  // Initial file drop handler - just sets the file, doesn't upload yet
  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      if (!isSignedIn) {
        clerk.openSignIn();
        return;
      }

      if (fileRejections.length > 0) {
        toast.error("Only .ost files are supported.");
        return;
      }

      const selectedFile = acceptedFiles[0];
      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop().toLowerCase();
        if (ext !== "ost") {
          toast.error("Only .ost files are supported.");
          return;
        }
        setFile(selectedFile);
        setUploadPhase("idle");
        if (handleConvertRef.current) {
          handleConvertRef.current(selectedFile);
        }
      }
    },
    [isSignedIn, clerk],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true, // We have a specific Browse button
    multiple: false,
    accept: {
      "application/vnd.ms-outlook": [".ost"],
      "application/octet-stream": [".ost"],
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

  const handleConvert = async (passedFile) => {
    const targetFile = passedFile || file;
    if (!targetFile) return;

    if (
      licenseStatus?.tier === "DemoExpired" ||
      licenseStatus?.status === "Expired" ||
      licenseStatus?.status === "Cancelled"
    ) {
      toast.error(
        "Your license has expired or been cancelled. Please upgrade to continue.",
      );
      navigate("/our-plans");
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setUploading(true);
    setUploadPhase("uploading");
    setFinishedPstDownload(false);
    uploadActive.current = true;

    try {
      const initialToken = await getToken();
      if (!initialToken) {
        console.warn("[Hero] No token found! Authentication might be missing.");
      }

      // Storage limit check for Professional users
      if (
        licenseStatus?.tier === "Professional" &&
        !passedFile?._storageLimitAccepted
      ) {
        const remaining =
          (licenseStatus.totalStorage || 0) - (licenseStatus.usedStorage || 0);
        if (targetFile.size > remaining) {
          setPendingFile(targetFile);
          setIsStorageLimitDialogOpen(true);
          setUploading(false);
          setUploadPhase("idle");
          return;
        }
      }

      // Pre-upload optimization: Check for duplicates
      setUploadDetail("Checking for existing conversions...");
      try {
        const fingerprint = await calculateFingerprint(targetFile);
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
        targetFile,
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
              setUploadDetail("Uploading OST file...");
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
      setFile(null); // Clear file to go back to upload screen
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

  const handleDirectPstDownload = async () => {
    if (!completedSession?.sessionId) return;
    try {
      setIsDownloadingPst(true);
      const controller = new AbortController();
      setAbortController(controller);
      const email = user?.primaryEmailAddress?.emailAddress;

      const savedName = await conversionService.convertToPst(
        completedSession.sessionId,
        getToken,
        true,
        (p) => console.log("[Hero] Download Progress:", p),
        controller.signal,
        email,
      );

      if (savedName) {
        toast.success(`Started downloading: ${savedName}`);
      }
      setFinishedPstDownload(true);
    } catch (err) {
      if (err.name === "AbortError" || err.message === "AbortError") {
        console.log("PST Download cancelled by user");
        return;
      }
      toast.error("Download failed: " + err.message);
    } finally {
      setIsDownloadingPst(false);
      setAbortController(null);
    }
  };

  return (
    <section className="py-12 md:py-4 px-4 md:px-6 lg:px-12 bg-white flex flex-col items-center min-h-[600px] justify-center">
      {/* Main Heading & Tagline */}
      <div className="text-center mb-12 max-w-4xl mx-auto space-y-1">
        <h1 className="text-xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
          Convert OST to PST Online Securely & Instantly
        </h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed">
          {/* An easy and free online method to convert OST to PST files instantly &
          securely. */}
          Upload your OST file and quickly convert it into PST format without any software hassle.
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
          className={`w-full ${uploading || completedSession ? "md:w-full" : "md:w-[55%]"} flex flex-col`}
        >
          <div
            {...getRootProps()}
            className={`
              w-full border-2 border-dashed rounded-[30px] p-4
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

                  {/* Feature Highlights Section */}
                  <div className="flex gap-4 mt-8 w-full max-w-[400px]">
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100/50 group/item hover:bg-emerald-50 transition-colors">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-600 text-left leading-tight">
                        No credit card required
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100/50 group/item hover:bg-emerald-50 transition-colors">
                      <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-600 text-left leading-tight">
                        15 days free trial
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100/50 group/item hover:bg-emerald-50 transition-colors">
                      <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-600 text-left leading-tight">
                        Sign up under your control
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Processing / Complete State */}
            {(uploading || completedSession) && (
              <div className="w-full animate-in fade-in duration-500 bg-white rounded-2xl p-2 md:p-6 text-center shadow-none md:shadow-sm">
                {/* File Info Card */}
                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm mb-10 w-full text-left">
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
                        File Uploaded Successfully.
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

                {/* Stepper Header */}
                <div className="flex justify-between items-start w-full max-w-lg mx-auto mb-12 relative">
                  {/* Connecting Line */}
                  <div className="absolute top-4 left-10 right-10 h-[2px] bg-slate-100 -z-10">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-500 ease-in-out"
                      style={{
                        width:
                          isDownloadingPst || finishedPstDownload
                            ? "100%"
                            : completedSession || uploadPhase === "complete"
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
                        File Uploaded (OST)
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
                        Preview OST File
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Convert */}
                  <div className="flex flex-col items-center gap-2 bg-white px-2 z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors border ${
                        isDownloadingPst || finishedPstDownload
                          ? "bg-emerald-100 text-emerald-600 border-emerald-200 shadow-sm"
                          : "bg-slate-50 text-slate-400 border-slate-100"
                      }`}
                    >
                      3
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isDownloadingPst ? (
                        <RotateCw className="w-4 h-4 text-emerald-500 animate-spin" />
                      ) : finishedPstDownload ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : null}
                      <span
                        className={`text-xs font-bold ${
                          isDownloadingPst || finishedPstDownload
                            ? "text-slate-600"
                            : "text-slate-400"
                        }`}
                      >
                        Convert
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Message / Actions */}
                {completedSession ? (
                  <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center justify-center gap-2">
                      OST File Uploaded Successfully!!
                    </h3>
                    <p className="text-slate-600 text-sm md:text-[15px] font-medium leading-relaxed">
                      You can Download the converted file as per your
                      requirement.
                      <br />
                      Select an option below to continue with your file.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectPstDownload();
                        }}
                        disabled={isDownloadingPst}
                        className="w-full sm:w-auto px-8 h-12 bg-white text-emerald-600 border-2 border-emerald-500 hover:bg-emerald-50 font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                      >
                        {isDownloadingPst && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {isDownloadingPst
                          ? "Preparing..."
                          : "Convert & Download PST"}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onUploadComplete)
                            onUploadComplete(completedSession);
                        }}
                        className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                      >
                        Preview & Convert
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

          {/* Secondary Features Row - Outside dashed box */}
          {!uploading && !completedSession && !file && (
            <div className="flex flex-wrap gap-6 mt-6 w-full justify-center text-slate-500 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <Lock className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
                <span className="text-[10px] font-bold tracking-wide whitespace-nowrap uppercase">
                  100% Secure & Private
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1">
                <Zap className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
                <span className="text-[10px] font-bold tracking-wide whitespace-nowrap uppercase">
                  Instant Conversion
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1">
                <Headphones className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
                <span className="text-[10px] font-bold tracking-wide whitespace-nowrap uppercase">
                  24/7 Tech Support
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <ExportDialog
        open={isExportDialogOpen}
        session={completedSession}
        onClose={() => setIsExportDialogOpen(false)}
      />

      <Dialog
        open={isStorageLimitDialogOpen}
        onOpenChange={setIsStorageLimitDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px] rounded-[24px]">
          <DialogHeader className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800 text-center">
              Insufficient Storage
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-center font-medium">
              The file you are uploading (
              {formatFileSize(pendingFile?.size || 0)}) exceeds your remaining
              storage space.
              <br />
              <br />
              Only the remaining part of your storage will be used for this
              upload. Do you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-center mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsStorageLimitDialogOpen(false);
                setPendingFile(null);
                setFile(null);
              }}
              className="px-6 rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsStorageLimitDialogOpen(false);
                if (pendingFile) {
                  pendingFile._storageLimitAccepted = true;
                  handleConvert(pendingFile);
                }
              }}
              className="px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Continue Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Hero;
