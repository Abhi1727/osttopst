import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  lazy,
  Suspense,
} from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate, useLocation, Route } from "react-router-dom";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { fileService } from "../../services/fileService";
import { conversionService } from "../../services/conversionService";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import FileText from "lucide-react/dist/esm/icons/file-text";
import RotateCw from "lucide-react/dist/esm/icons/rotate-cw";
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Clock from "lucide-react/dist/esm/icons/clock";
import CloudUpload from "lucide-react/dist/esm/icons/cloud-upload";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Crown from "lucide-react/dist/esm/icons/crown";
import Hexagon from "lucide-react/dist/esm/icons/hexagon";
import Shield from "lucide-react/dist/esm/icons/shield";
// import X from "lucide-react/dist/esm/icons/x";
import { Progress } from "@/components/ui/progress";
const UpgradeModal = lazy(() => import("./pricingpop"));

const ExportDialog = lazy(() => import("../ExportDialog"));
import licenseService from "../../services/licenseService";
import { Button } from "@/components/ui/button";

const Hero = ({ onUploadComplete, onRestore }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({
    percent: 0,
    phase: null,
    detail: "",
  });
  const [uploadPhase, setUploadPhase] = useState(null); // 'uploading' | 'processing' | 'complete'
  const [uploadDetail, setUploadDetail] = useState("");
  const [completedSession, setCompletedSession] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [finishedDownload, setFinishedDownload] = useState(false);
  const [showOversizedFileModal, setShowOversizedFileModal] = useState(false);

  const { getToken } = useAuth();
  const uploadActive = useRef(false);
  const handleConvertRef = useRef(null);

  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const navigate = useNavigate();
  const location = useLocation();

  const formatMap = {
    "/ost-to-pdf": "PDF",
    "/ost-to-json": "JSON",
    "/ost-to-mbox": "MBOX",
    "/ost-to-eml": "EML",
    "/ost-to-msg": "MSG",
    "/ost-to-html": "HTML",
    "/ost-to-mhtml": "MHTML",
    "/ost-to-doc": "DOC",
    "/ost-to-docx": "DOCX",
    "/ost-to-txt": "TXT",
    "/ost-to-rtf": "RTF",
    "/ost-to-csv": "CSV",
    "/ost-to-xml": "XML",
    "/ost-to-vcf": "VCF",
    "/ost-to-ics": "ICS",
    "/ost-to-xps": "XPS",
    "/ost-to-tiff": "TIFF",
  };
  const currentFormat = formatMap[location.pathname] || "PST";

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

  // Prevent page refresh during active operations
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (uploading || isDownloading) {
        e.preventDefault();
        e.returnValue = ""; // Required for modern browsers to show the generic dialog
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [uploading, isDownloading]);

  const showTrialExpiredToast = () => {
    toast.error(
      <span>
        Your trial has expired.{" "}
        <Link
          to="/pricing"
          style={{
            color: "#3b82f6",
            fontWeight: 700,
            textDecoration: "underline",
          }}
        >
          Buy a plan
        </Link>{" "}
        to continue uploading files.
      </span>,
      { duration: 6000 },
    );
  };

  const rawTier = licenseStatus?.tier ?? licenseStatus?.Tier;
  const tierStr = String(rawTier ?? "").toLowerCase();
  const isProfessional = tierStr === "3" || tierStr === "professional";

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      if (uploading) return;

      if (!isSignedIn) {
        clerk.openSignIn();
        return;
      }

      if (licenseStatus && licenseStatus.canConvert === false) {
        showTrialExpiredToast();
        return;
      }

      const selectedFile = acceptedFiles[0];

      // Integrity check (Magic Number & Size)
      const integrity = await fileService.validateFileIntegrity(selectedFile);
      if (!integrity.valid) {
        toast.error(integrity.error);
        return;
      }

      const MAX_SIZE = isProfessional
        ? 5 * 1024 * 1024 * 1024 // 5 GB
        : 500 * 1024 * 1024; // 500 MB

      if (selectedFile.size > MAX_SIZE) {
        setShowOversizedFileModal(true);
        return;
      }
      setFile(selectedFile);
      setUploading(true);
      setUploadPhase("uploading");
      setUploadDetail("Initializing secure upload...");

      const controller = new AbortController();
      setAbortController(controller);

      try {
        // Start Upload
        const session = await fileService.uploadFile(
          selectedFile,
          getToken,
          (prog) =>
            setProgress(
              typeof prog === "object"
                ? prog
                : { percent: prog, phase: "uploading" },
            ),
          null, // password
          controller.signal,
          user?.primaryEmailAddress?.emailAddress ?? null,
          "Conversion",
        );

        // Backend returns sessionId, not _id
        const sessionId = session.sessionId || session._id;
        setActiveSessionId(sessionId);

        // Store session object so Preview / Download buttons have the data they need
        const completedData = { ...session, sessionId };
        setCompletedSession(completedData);
        if (onUploadComplete) onUploadComplete(completedData);
        toast.success(
          `Upload complete! Click Download to convert and download your ${currentFormat} file.`,
        );
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
    [
      isSignedIn,
      getToken,
      uploading,
      clerk,
      onUploadComplete,
      licenseStatus,
      isProfessional,
    ],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: false,
    accept: {
      "application/vnd.ms-outlook": [".ost"],
      "application/octet-stream": [".ost"],
    },
  });

  const handleDownload = async () => {
    if (!completedSession) return;
    setIsDownloading(true);
    setFinishedDownload(false);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const sessionId = completedSession.sessionId || completedSession._id;
      const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;

      if (currentFormat === "PST") {
        await conversionService.convertToPst(
          sessionId,
          getToken,
          false,
          undefined,
          controller.signal,
          userEmail,
        );
      } else {
        await conversionService.exportAll(
          sessionId,
          currentFormat,
          false,
          getToken,
          undefined,
          controller.signal,
          { email: userEmail },
        );
      }

      const name =
        completedSession.originalName ||
        completedSession.originalFileName ||
        completedSession.fileName ||
        "converted";

      const ext = currentFormat === "PST" ? ".pst" : ".zip";
      const savedName = name.replace(/\.(ost|pst)$/i, "") + ext;

      toast.success(`Started downloading: ${savedName}`);
      window.dispatchEvent(new Event("license-refresh"));
      setFinishedDownload(true);
    } catch (err) {
      if (err.name === "AbortError" || err.message === "AbortError") {
        console.log(`${currentFormat} Download cancelled by user`);
        return;
      }
      toast.error("Download failed: " + err.message);
    } finally {
      setIsDownloading(false);
      setAbortController(null);
    }
  };

  return (
    <section className="relative pt-6 pb-8 lg:pb-4 px-3 md:px-5 lg:px-8 w-full min-h-[650px] lg:min-h-[600px] flex items-center">
      <div className="max-w-[1440px] mx-auto relative z-10 w-full lg:grid lg:grid-cols-[1fr_1.3fr] lg:gap-10 items-center">
        {/* Left Column: Heading & Benefits */}
        <div className="text-left py-4 md:py-8 lg:py-4 flex flex-col md:items-center lg:items-start md:text-center lg:text-left">
          <h1 className="mb-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 tracking-tighter leading-tight">
            Convert{" "}
            <span className="text-brand-500 font-bold uppercase">
              &nbsp; OST &nbsp; TO &nbsp; {currentFormat}
            </span>{" "}
            <br />
            Online - Fast & Secure
          </h1>
          <p className="mb-6 text-base text-slate-600 font-medium max-w-sm md:max-w-lg leading-relaxed">
            Instantly convert Outlook OST files to {currentFormat} format in
            your browser. Preview and export your data safely without any
            software installation.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-y-4 gap-x-8 max-w-lg mt-4 md:mt-6">
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-slate-900 shrink-0" />
              <span className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                256-bit SSL encryption
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Hexagon size={20} className="text-slate-900 shrink-0" />
              <span className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                Instant conversion
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-slate-900 shrink-0" />
              <span className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                24/7 expert support
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Crown size={20} className="text-slate-900 shrink-0" />
              <span className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                Zero data storage
              </span>
            </div>
          </div>
          <div className="mt-6 text-sm text-slate-500 font-medium">
            Trusted by 500,000+ users worldwide · Works with all Outlook
            versions
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
                    <CloudUpload
                      size={96}
                      className="w-full h-full text-slate-900 stroke-[1.2]"
                    />
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
                        } else if (
                          licenseStatus &&
                          licenseStatus.canConvert === false
                        ) {
                          showTrialExpiredToast();
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
                          {(
                            (completedSession?.originalName ||
                              completedSession?.originalFileName ||
                              completedSession?.fileName ||
                              "file") + ""
                          ).replace(/\.(ost|pst)$/i, "")}
                          {currentFormat === "PST" ? ".ost" : ".zip"} — Ready
                        </p>
                      </div>

                      {/* Two action buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/preview");
                          }}
                          variant="outline"
                          className="flex-1 h-12 border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 text-slate-700 hover:text-brand-600 font-black text-sm uppercase tracking-widest rounded-xl gap-2 transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          Preview OST
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload();
                          }}
                          disabled={isDownloading}
                          className="flex-1 h-12 bg-brand-500 hover:bg-brand-600 text-white font-black text-sm uppercase tracking-widest rounded-xl gap-2 shadow-lg shadow-brand-500/25 transition-all active:scale-95"
                        >
                          {isDownloading ? (
                            <RotateCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                          {isDownloading
                            ? "Preparing..."
                            : `Download ${currentFormat}`}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className=" flex flex-col gap-3">
                      <p className="text-xs font-bold sm:text-sm  font-bold tracking-tight">
                        Supports .ost files · Max{" "}
                        {isProfessional ? "5GB" : "500MB"} · Unlimited with
                        desktop app
                      </p>
                      <p className="text-xs sm:text-sm md:text-base text-slate-900 font-medium sm:whitespace-nowrap px-2">
                        Agreed to{" "}
                        <span className="font-bold">Privacy Policy</span>. Use{" "}
                        <span className="font-bold">Desktop Software</span> for
                        unlimited size
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
                      Uploading File...
                    </span>
                    <span className="text-xs font-black text-slate-400">
                      {Math.round(progress?.percent || 0)}%
                    </span>
                  </div>
                  <Progress
                    value={progress?.percent || 0}
                    className="h-2 bg-slate-100"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isExportDialogOpen && (
        <Suspense fallback={null}>
          <ExportDialog
            open={isExportDialogOpen}
            session={completedSession}
            onClose={() => setIsExportDialogOpen(false)}
          />
        </Suspense>
      )}
      {showOversizedFileModal && (
        <Suspense fallback={null}>
          <UpgradeModal onClose={() => setShowOversizedFileModal(false)} />
        </Suspense>
      )}
    </section>
  );
};

export default Hero;
