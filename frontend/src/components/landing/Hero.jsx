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
  FileUp, // Correct name for UploadFile
  CloudUpload, // Standard name
  ShieldCheck as VerifiedUser, // Alias for better naming
  Bolt,
  Headset, // Correct name for SupportAgent
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import conversionVideo from "../../assets/Website_Color_Scheme_and_Video.mp4";
import imagePng from "../../assets/image.png";
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
        const total =
          licenseStatus.totalStorageAllotted ??
          licenseStatus.TotalStorageAllotted ??
          0;
        const used =
          licenseStatus.totalStorageUsed ?? licenseStatus.TotalStorageUsed ?? 0;
        const remaining = total - used;
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
        user?.primaryEmailAddress?.emailAddress,
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
        window.dispatchEvent(new Event("license-refresh"));
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
    <section className="relative bg-[#f8fbff] py-12 px-4 md:px-8 flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Fully Immersive Blueish Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e0f2fe] via-[#f0f7ff] to-[#eef7ff] pointer-events-none" />
      
      {/* Dynamic Glow Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-200/20 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-100/30 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/4" />
      
      <div className="max-w-6xl mx-auto text-center relative z-10 w-full">
        <h1 className="mb-4 ">
          Convert <span className="header-text-gradient">OST to PST</span>{" "}
          Online 
        </h1>
        <p className="mb-8 max-w-2xl mx-auto font-medium px-2">
          Drag, upload, preview, and export your Outlook data safely from any browser.
        </p>

        <div className="flex justify-center w-full">
          {/* Main Upload Area */}
          <div className="w-full max-w-4xl">
            <div className="w-full rounded-[32px] md:rounded-[40px] bg-white border border-blue-100/50 shadow-[0_30px_60px_-15px_rgba(14,165,233,0.12)] overflow-hidden relative">
              <div
                {...getRootProps()}
                className={`py-6 px-4 md:p-8 relative z-10 transition-all ${isDragActive ? "bg-brand-50/50" : ""}`}
              >
                <input
                  {...getInputProps()}
                  disabled={uploading || !!completedSession}
                />

                {/* Default/Idle State */}
                {!uploading && !completedSession && (
                  <div className="flex flex-col items-center py-2 md:py-4">
                    <div className="mb-2 md:mb-4 flex justify-center max-w-[220px] md:max-w-[400px] pointer-events-none">
                      <img
                        src={imagePng}
                        alt="OST to PST Conversion"
                        className="w-full h-auto object-contain scale-100"
                      />
                    </div>
                    <h3 className="mb-2">
                      Upload your OST File
                    </h3>
                    <p className="text-slate-500 font-medium text-xs md:text-base mb-3 md:mb-6">
                      Preview Converted OST file in few simple steps
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSignedIn) {
                          clerk.openSignIn();
                        } else {
                          open();
                        }
                      }}
                      className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 md:px-12 py-3.5 md:py-4 rounded-xl md:rounded-[20px] font-semibold text-lg md:text-xl shadow-[0_15px_30px_-5px_rgba(14,165,233,0.3)] transition-all hover:-translate-y-1 active:scale-[0.98] flex items-center gap-3 md:gap-4 mx-auto group w-full max-w-[260px] md:max-w-none justify-center"
                    >
                      <FileUp className="w-5 h-5 md:w-8 md:h-8 group-hover:rotate-6 transition-transform" />
                      Upload OST File
                    </button>
                    <div className="mt-4 md:mt-6 flex flex-col gap-1 md:gap-2">
                      <p className="uppercase tracking-[0.25em] font-semibold text-[8px] md:text-[9px] text-slate-400">
                        50MB UPLOAD FILE SIZE LIMIT
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-[9px] md:text-xs font-medium text-slate-500">
                        <p>
                          By uploading the OST file you agree to our{" "}
                          <a
                            className="text-[#0ea5e9] font-semibold hover:underline"
                            href="#"
                          >
                            Privacy Policy
                          </a>
                        </p>
                        <span className="hidden md:inline text-slate-300">|</span>
                        <p>
                          For unlimited size use{" "}
                          <a
                            className="text-[#0ea5e9] font-semibold hover:underline"
                            href="#"
                          >
                            Desktop Software
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing / Complete State */}
                {(uploading || completedSession) && (
                  <div className="w-full animate-in fade-in duration-500 text-center">
                    {/* File Info / Progress Area */}
                    <div className="flex flex-col items-center gap-6 md:gap-8">
                      <div className="w-20 h-20 md:w-28 md:h-28 bg-brand-50 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-inner border border-brand-100">
                        {completedSession ? (
                          <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-brand-500" />
                        ) : (
                          <RotateCw className="w-12 h-12 md:w-16 md:h-16 text-brand-600 animate-spin" />
                        )}
                      </div>

                      <div className="space-y-4">
                        <h3 className="mb-2">
                          {completedSession
                            ? "File Uploaded Successfully!"
                            : "Processing Your File..."}
                        </h3>
                        <p className="text-slate-500 font-medium text-lg">
                          {file?.name} ({formatFileSize(file?.size || 0)})
                        </p>
                      </div>

                      {!completedSession && (
                        <div className="w-full max-w-md space-y-4">
                          <div className="flex justify-between items-center text-sm font-semibold text-brand-600 uppercase tracking-widest">
                            <span>
                              {uploadPhase === "processing"
                                ? "Finalizing"
                                : "Uploading"}
                            </span>
                            <span>{progress}%</span>
                          </div>
                          <Progress
                            value={progress}
                            className="h-3 bg-slate-100 rounded-full overflow-hidden"
                            indicatorClassName="bg-brand-500"
                          />
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            {uploadDetail || "Preparing conversion..."}
                          </p>
                        </div>
                      )}

                      {completedSession ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectPstDownload();
                            }}
                            disabled={isDownloadingPst}
                            className="w-full sm:w-auto bg-white border-2 border-brand-500 text-brand-600 px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:bg-brand-50 transition-all flex items-center justify-center gap-2"
                          >
                            {isDownloadingPst && (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            )}
                            Convert & Download PST
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUploadComplete)
                                onUploadComplete(completedSession);
                            }}
                            className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl shadow-brand-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            Preview OST File
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel();
                          }}
                          className="text-rose-500 font-semibold text-sm uppercase tracking-widest hover:text-rose-600 transition-colors"
                        >
                          Cancel Conversion
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer of the Card */}
              <div className="bg-[#fcfdfe] border-t border-slate-50 grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100 py-1.5 md:py-3 px-2 md:px-8">
                <div className="flex items-center justify-center gap-1.5 md:gap-3 text-[8px] md:text-[9px] font-semibold text-slate-400 p-1.5 md:p-2 group cursor-default">
                  <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-[#0ea5e9]" />
                  SECURE
                </div>
                <div className="flex items-center justify-center gap-1.5 md:gap-3 text-[8px] md:text-[9px] font-semibold text-slate-400 p-1.5 md:p-2 group cursor-default">
                  <Bolt className="w-3 h-3 md:w-4 md:h-4 text-[#0ea5e9]" />
                  INSTANT
                </div>
                <div className="flex items-center justify-center gap-1.5 md:gap-3 text-[8px] md:text-[9px] font-semibold text-slate-400 p-1.5 md:p-2 group cursor-default">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-[#0ea5e9]" />
                  24/7 TECH
                </div>
                <button 
                  onClick={() => navigate('/our-plans')}
                  className="flex items-center justify-center gap-1.5 md:gap-3 text-[8px] md:text-[9px] font-bold text-slate-400 p-1.5 md:p-2 group hover:text-brand-600 transition-colors"
                >
                  <span className="text-[#0ea5e9] bg-[#e0effe] px-1.5 py-0.5 rounded-sm font-bold text-[7px] md:text-[10px]">
                    PRO
                  </span>
                  UPGRADE
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Area: Calculator & Variants */}
          {/* Sidebar Area: Calculator & Variants (Commented out per user request)
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[32px] p-6 border border-blue-100/50 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 opacity-60"></div>
              <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-500" />
                Know Your OST Conversion Time
              </h4>
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="px-4 py-3">File Size</th>
                      <th className="px-4 py-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    <tr className="hover:bg-brand-50/30 transition-colors">
                      <td className="px-4 py-3">1 GB</td>
                      <td className="px-4 py-3">20 Seconds</td>
                    </tr>
                    <tr className="hover:bg-brand-50/30 transition-colors">
                      <td className="px-4 py-3">5 GB</td>
                      <td className="px-4 py-3">1 Minute</td>
                    </tr>
                    <tr className="hover:bg-brand-50/30 transition-colors">
                      <td className="px-4 py-3">20 GB</td>
                      <td className="px-4 py-3">3 Minutes</td>
                    </tr>
                    <tr className="bg-brand-50/50 hover:bg-brand-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-brand-600">50 GB</td>
                      <td className="px-4 py-3 font-bold text-brand-600">6 Minutes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl"></div>
               <h4 className="text-base font-bold mb-4 flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-brand-400" />
                 Supports All OST & PST Variants
               </h4>
               <div className="grid grid-cols-1 gap-2.5">
                 {[
                   "Unicode format (2007+)",
                   "ANSI format (97-2003)",
                   "Exchange Server versions",
                   "Encrypted/Password OSTs",
                   "32-bit & 64-bit Outlook",
                   "Outlook for Microsoft 365"
                 ].map((item, idx) => (
                   <div key={idx} className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                     <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                     {item}
                   </div>
                 ))}
               </div>
            </div>
          </div>
          */}
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
              variant="ghost"
              onClick={() => {
                setIsStorageLimitDialogOpen(false);
                if (pendingFile) {
                  pendingFile._storageLimitAccepted = true;
                  handleConvert(pendingFile);
                }
              }}
              className="px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
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
