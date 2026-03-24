import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
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
  Shield,
  UserCheck,
  Clock,
  Headphones,
  FileUp,
  CloudUpload,
  ShieldCheck as VerifiedUser,
  Bolt,
  Headset,
  Crown,
  Hexagon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import conversionVideo from "../../assets/Website_Color_Scheme_and_Video.mp4";
import imagePng from "../../assets/image.png";
import ExportDialog from "../ExportDialog";
import licenseService from "../../services/licenseService";
import { Button } from "@/components/ui/button";

const Hero = ({ onUploadComplete, onRestore }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, phase: null, detail: "" });
  const [uploadPhase, setUploadPhase] = useState(null); // 'uploading' | 'processing' | 'complete'
  const [uploadDetail, setUploadDetail] = useState("");
  const [completedSession, setCompletedSession] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isDownloadingPst, setIsDownloadingPst] = useState(false);
  const [finishedPstDownload, setFinishedPstDownload] = useState(false);

  const { getToken } = useAuth();
  const uploadActive = useRef(false);
  const handleConvertRef = useRef(null);

  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const navigate = useNavigate();

  const [licenseStatus, setLicenseStatus] = useState(null);

  useEffect(() => {
    const fetchLicense = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          const email = user?.primaryEmailAddress?.emailAddress;
          const status = await licenseService.getLicenseStatus(token, email);
          setLicenseStatus(status);
        } catch (err) {
          console.error("Error in fetchLicense:", err);
        }
      }
    };
    fetchLicense();
    window.addEventListener("license-refresh", fetchLicense);
    return () => window.removeEventListener("license-refresh", fetchLicense);
  }, [isSignedIn, getToken]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      if (uploading) return;

      if (!isSignedIn) {
        clerk.openSignIn();
        return;
      }

      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setUploading(true);
      setUploadPhase("uploading");
      setUploadDetail("Initializing secure upload...");

      const controller = new AbortController();
      setAbortController(controller);

      try {
        const token = await getToken();
        
        // Start Upload
        const session = await fileService.uploadFile(
          selectedFile,
          token,
          (prog) => setProgress(typeof prog === 'object' ? prog : { percent: prog, phase: 'uploading' }),
          null, // password
          controller.signal,
          user?.primaryEmailAddress?.emailAddress ?? null
        );

        // Backend returns sessionId, not _id
        const sessionId = session.sessionId || session._id;
        setActiveSessionId(sessionId);
        setUploadPhase("processing");
        setUploadDetail("Processing OST structure...");

        // Start conversion in background — only polls for "Ready", does NOT download
        await conversionService.triggerConversion(
          sessionId,
          getToken,
          (prog) => setProgress(typeof prog === 'object' ? prog : { percent: prog, phase: 'processing' }),
          controller.signal,
          user?.primaryEmailAddress?.emailAddress ?? null
        );

        // Store session object so Preview / Download buttons have the data they need
        const completedData = { ...session, sessionId };
        setCompletedSession(completedData);
        if (onUploadComplete) onUploadComplete(completedData);
        toast.success("Conversion complete! Choose to preview or download below.");
      } catch (err) {
        if (err.name === "AbortError") {
          toast.info("Upload cancelled");
        } else {
          toast.error(err.message || "Something went wrong");
        }
        setFile(null);
        setUploading(false);
        setActiveSessionId(null);
      } finally {
        setAbortController(null);
        setUploading(false);
      }
    },
    [isSignedIn, getToken, uploading, clerk, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: false,
    accept: {
      "application/vnd.ms-outlook": [".ost"],
      "application/octet-stream": [".ost"]
    },
  });

  const handleDownloadPst = async () => {
    if (!completedSession) return;
    setIsDownloadingPst(true);
    setFinishedPstDownload(false);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const sessionId = completedSession.sessionId || completedSession._id;
      await conversionService.convertToPst(
        sessionId,
        getToken,
        false,
        undefined,
        controller.signal,
        user?.primaryEmailAddress?.emailAddress ?? null
      );
      // Assuming convertToPst now handles the browser-native download directly
      // and toast/license refresh should happen after successful initiation of download
      const name = completedSession.originalName || completedSession.originalFileName || completedSession.fileName || "converted";
      const savedName = name.replace(".ost", "").replace(".pst", "") + ".pst";
      toast.success(`Started downloading: ${savedName}`);
      window.dispatchEvent(new Event("license-refresh"));
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
    <section className="relative pt-6 pb-8 lg:pb-4 px-3 md:px-5 lg:px-8 w-full">
      <div className="max-w-[1440px] mx-auto relative z-10 w-full lg:grid lg:grid-cols-[1fr_1.3fr] lg:gap-10 items-center">
        {/* Left Column: Heading & Benefits */}
        <div className="text-left py-4 md:py-8 lg:py-4 flex flex-col md:items-center lg:items-start md:text-center lg:text-left">
          <h1 className="mb-4 text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-slate-800 tracking-tight leading-tight">
            Convert <span className="text-brand-500 font-extrabold uppercase tracking-tight">OST to PST</span> Online
          </h1>
          <p className="mb-8 text-base sm:text-lg text-slate-600 font-medium max-w-sm md:max-w-xl lg:max-w-sm leading-relaxed">
            Drag, Upload, Preview, and Export your outlook
            data safely from any browser
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-y-6 gap-x-6 sm:gap-x-8 max-w-sm sm:max-w-2xl lg:max-w-sm mt-4 md:mt-8 lg:mt-4">
            <div className="flex flex-col sm:items-center lg:items-start lg:flex-row gap-2 lg:gap-3">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 lg:w-5 lg:h-5 text-slate-900" />
              <span className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Secure
              </span>
            </div>
            <div className="flex flex-col sm:items-center lg:items-start lg:flex-row gap-2 lg:gap-3">
              <Hexagon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-5 lg:h-5 text-slate-900" />
              <span className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Instant
              </span>
            </div>
            <div className="flex flex-col sm:items-center lg:items-start lg:flex-row gap-2 lg:gap-3">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 lg:w-5 lg:h-5 text-slate-900" />
              <span className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                24/7 Tech
              </span>
            </div>
            <div className="flex flex-col sm:items-center lg:items-start lg:flex-row gap-2 lg:gap-3">
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 lg:w-5 lg:h-5 text-slate-900" />
              <span className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Upgrade
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Upload Card */}
        <div className="flex justify-center w-full py-4 md:py-8 lg:py-4">
          <div className="w-full max-w-[950px] bg-white rounded-[24px] sm:rounded-[32px] px-6 py-8 sm:px-10 sm:py-12 md:py-16 lg:px-10 lg:py-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center text-center relative overflow-hidden transition-all">
            {(!uploading || completedSession) && (
              <div
                {...getRootProps()}
                className={`w-full transition-all duration-300 border-none cursor-pointer group`}
              >
                <input {...getInputProps()} />
                
                <div className="flex flex-col items-center gap-6 sm:gap-8 lg:gap-6">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-24 lg:h-24 flex items-center justify-center">
                    <CloudUpload className="w-full h-full text-slate-900 stroke-[1.2]" />
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl font-bold text-slate-900 tracking-tight mb-1">
                    Upload Your OST File
                  </h3>

                  <div className="w-full max-w-sm sm:max-w-md lg:max-w-sm">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSignedIn) {
                          clerk.openSignIn();
                        } else {
                          open();
                        }
                      }}
                      disabled={uploading}
                      className="w-full h-14 bg-brand-500 hover:bg-brand-600 text-lg md:text-xl font-bold rounded-xl flex gap-3 shadow-[0_12px_35px_-8px_rgba(14,165,233,0.3)] border-none transition-all active:scale-95"
                    >
                      {uploading ? (
                         <RotateCw className="w-5 h-5 animate-spin" />
                      ) : (
                         <UploadCloud className="w-6 h-6 md:w-7 md:h-7" />
                      )}
                      {uploading ? "Uploading..." : "Upload OST File"}
                    </Button>
                  </div>

                  {completedSession ? (
                    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-4 mt-2">
                      {/* Success indicator */}
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <p className="text-sm font-bold text-slate-700 truncate max-w-xs">
                          {((completedSession?.originalName || completedSession?.originalFileName || completedSession?.fileName || "file") + "").replace(/\.(ost|pst)$/i, "")}.pst — Ready
                        </p>
                      </div>

                      {/* Two action buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button
                          onClick={(e) => { e.stopPropagation(); navigate("/preview"); }}
                          variant="outline"
                          className="flex-1 h-12 border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 text-slate-700 hover:text-brand-600 font-black text-sm uppercase tracking-widest rounded-xl gap-2 transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          Preview OST
                        </Button>
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleDownloadPst(); }}
                          disabled={isDownloadingPst}
                          className="flex-1 h-12 bg-brand-500 hover:bg-brand-600 text-white font-black text-sm uppercase tracking-widest rounded-xl gap-2 shadow-lg shadow-brand-500/25 transition-all active:scale-95"
                        >
                          {isDownloadingPst ? (
                            <RotateCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                          {isDownloadingPst ? "Preparing..." : "Download PST"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                  <div className="mt-4 flex flex-col gap-3">
                    <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-tight">
                      Some upload file size limit apply
                    </p>
                    <p className="text-xs sm:text-sm md:text-base text-slate-900 font-medium sm:whitespace-nowrap px-2">
                      Agreed to <span className="font-bold">Privacy Policy</span>. Use <span className="font-bold">Desktop Software</span> for unlimited size
                    </p>
                  </div>
                  )}
                </div>
              </div>
            )}

            {uploading && !completedSession && (
              <div className="w-full flex flex-col items-center py-6">
                 <div className="w-full max-w-md animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-brand-500 uppercase tracking-widest">
                        {uploadPhase === "uploading" ? "Transferring..." : "Processing..."}
                      </span>
                      <span className="text-xs font-black text-slate-400">
                        {Math.round(progress?.percent || 0)}%
                      </span>
                    </div>
                    <Progress value={progress?.percent || 0} className="h-2 bg-slate-100" />
                  </div>
              </div>
            )}
          </div>
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
