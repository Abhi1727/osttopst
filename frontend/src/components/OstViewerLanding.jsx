import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import {
  CloudUpload,
  Check,
  Monitor,
  Globe,
  Zap,
  Mail,
  Paperclip,
  Users,
  Calendar,
  Search,
  Shield,
  Clock,
  ChevronDown,
  Star,
  Phone,
  Upload,
  Cpu,
  Eye,
  FileText,
  WifiOff,
  Archive,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { fileService } from "../services/fileService";
import UpgradeModal from "./landing/pricingpop";
import licenseService from "../services/licenseService";

// ─── Hero / Upload ───────────────────────────────────────────────────────────

const HeroUpload = ({ onSessionReady }) => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { openSignIn } = useClerk();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user } = useUser();
  const [licenseStatus, setLicenseStatus] = useState(null);
  const fileInputRef = useRef(null);

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
  }, [isSignedIn, getToken, user]);

  // Prevent page refresh during active operations
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [uploading]);

  const rawTier = licenseStatus?.tier ?? licenseStatus?.Tier;
  const tierStr = String(rawTier ?? "").toLowerCase();
  const isProfessional = tierStr === "3" || tierStr === "professional";

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;

      // 1. Basic extension check
      const ext = file.name.split(".").pop().toLowerCase();
      if (!["OST", "pst"].includes(ext)) {
        toast.error("Only .OST and .pst files are supported.");
        return;
      }

      // 2. Integrity check (Magic Number & Size)
      const integrity = await fileService.validateFileIntegrity(file);
      if (!integrity.valid) {
        toast.error(integrity.error);
        return;
      }

      const MAX_SIZE = isProfessional
        ? 5 * 1024 * 1024 * 1024 // 5 GB
        : 500 * 1024 * 1024; // 500 MB
      if (file.size > MAX_SIZE) {
        setShowUpgradeModal(true);
        return;
      }
      setUploading(true);
      setProgress({ phase: "init", percent: 0, detail: "Initializing..." });
      try {
        const result = await fileService.uploadFile(
          file,
          getToken,
          (info) => setProgress(info),
          user?.id, // Pass the User ID for session registration
          null,
          null,
          null,
          "Viewer",
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

  const handleBrowseClick = () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      openSignIn({ afterSignInUrl: window.location.pathname });
      return;
    }
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isLoaded) return;
    if (!isSignedIn) {
      openSignIn({ afterSignInUrl: window.location.pathname });
      return;
    }
    handleFile(e.dataTransfer.files[0]);
  };

  const handleFileInputChange = (e) => {
    if (!isLoaded || !isSignedIn) return;
    handleFile(e.target.files[0]);
  };

  return (
    <div className="w-full max-w-[950px] bg-white rounded-[24px] sm:rounded-[32px] px-6 py-8 sm:px-10 sm:py-12 md:py-16 lg:px-10 lg:py-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center text-center relative overflow-hidden transition-all">
      <div className="w-full transition-all duration-300 border-none cursor-pointer group">
        <input
          ref={fileInputRef}
          type="file"
          accept=".OST"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="flex flex-col items-center gap-6 sm:gap-8 lg:gap-6">
          {/* ICON */}
          <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-24 lg:h-24 flex items-center justify-center">
            <CloudUpload
              size={96}
              className="w-full h-full text-slate-900 stroke-[1.2]"
            />
          </div>

          {/* TITLE */}
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl font-bold text-slate-900 tracking-tight mb-1">
            Upload Your OST File
          </h3>

          {/* BUTTON */}
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
              disabled={uploading}
              className="w-full h-14 bg-brand-500 hover:bg-brand-600 text-lg md:text-xl font-bold rounded-xl flex gap-3 items-center justify-center shadow-[0_12px_35px_-8px_rgba(14,165,233,0.3)] transition-all active:scale-95 text-white"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
              {uploading ? "Uploading..." : "Upload OST File"}
            </button>
          </div>

          <p className="text-xs sm:text-sm font-bold tracking-tight mt-6">
            Supports .OST/.pst files · Max {isProfessional ? "5GB" : "500MB"}
          </p>
          <p className="text-xs sm:text-sm text-slate-900 font-medium">
            Secure upload · No data stored
          </p>
        </div>
      </div>

      {/* MODAL */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
};

// ─── Section Heading ─────────────────────────────────────────────────────────

const SectionHeading = ({ label, title, sub }) => (
  <div className="text-center mb-12 md:mb-16">
    {label && (
      <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-[11px] font-black uppercase tracking-widest mb-4">
        {label}
      </div>
    )}
    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
      {title}
    </h2>
    {sub && (
      <p className="text-base md:text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
        {sub}
      </p>
    )}
  </div>
);

// ─── FAQ Item ────────────────────────────────────────────────────────────────

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-slate-50 transition-colors gap-4"
      >
        <span className="font-bold text-slate-800 text-sm md:text-base leading-snug">
          {q}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm md:text-base text-slate-500 font-medium leading-relaxed bg-white">
          {a}
        </div>
      )}
    </div>
  );
};

// ─── Main Landing ─────────────────────────────────────────────────────────────

const OSTViewerLanding = ({ onSessionReady }) => {
  const [activeTab, setActiveTab] = useState("emails");

  useEffect(() => {
    document.title = "Open our Online OST Previewer- No Download Required";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "OST Viewer Online- View OST emails, contacts, calendars & attachments. No Outlook or Exchange installation required.",
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content =
        "OST Viewer Online- View OST emails, contacts, calendars & attachments. No Outlook or Exchange installation required.";
      document.head.appendChild(meta);
    }
  }, []);

  const dataTypesTabs = [
    {
      id: "emails",
      label: "Emails",
      title: "Emails",
      content: (
        <>
          We enable the preview of all OST mailbox data
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Sender</li>
            <li>Receiver</li>
            <li>Subject</li>
            <li>Body Content</li>
            <li>Attachments</li>
            <li>Format</li>
            <li>Images</li>
          </ul>
        </>
      ),
    },
    {
      id: "attachments",
      label: "Attachments",
      title: "Attachments",
      content: (
        <>
          Our tool provides an entire file preview of the OST mailbox along with
          attachments.
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Audios</li>
            <li>Videos</li>
            <li>Images</li>
            <li>Documents</li>
            <li>PDF File</li>
            <li>ZIP File</li>
          </ul>
        </>
      ),
    },
    {
      id: "contacts",
      label: "Contacts",
      title: "Contacts",
      content: (
        <>
          We permit exporting Outlook contacts with no data loss.
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Names</li>
            <li>Mobile Number</li>
            <li>Email Address</li>
            <li>Company Information</li>
            <li>Notes</li>
            <li>Person Profile</li>
          </ul>
        </>
      ),
    },
    {
      id: "calendars",
      label: "Calendars",
      title: "Calendars",
      content: (
        <>
          Our tool allow to open and read OST calendars to your local desktop.
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Appointments</li>
            <li>Meetings</li>
            <li>Events</li>
            <li>Task</li>
            <li>Location</li>
            <li>Time</li>
            <li>Begin and End Date</li>
          </ul>
        </>
      ),
    },
    {
      id: "tasks",
      label: "Tasks",
      title: "Tasks",
      content: (
        <>
          We let you read the task information, and for a big OST file, utilize
          the filter feature.
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Status</li>
            <li>Priority</li>
            <li>Starting & Ending Date</li>
            <li>Progress</li>
            <li>Task Details</li>
            <li>Subject</li>
          </ul>
        </>
      ),
    },
    {
      id: "notes",
      label: "Notes",
      title: "Notes",
      content: (
        <>
          Our OST Viewer provides a way to view the details of notes.
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Memos</li>
            <li>Fast Reminders</li>
            <li>Written Notes</li>
          </ul>
        </>
      ),
    },
    {
      id: "folder-format",
      label: "Folder Format",
      title: "Folder Format",
      content: (
        <>
          We help you view the original mailbox sequence.
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Drafts</li>
            <li>Sent</li>
            <li>Inbox</li>
            <li>Removed Items</li>
          </ul>
        </>
      ),
    },
  ];

  const whyItems = [
    {
      icon: Eye,
      title: "1. Only Read Mode",
      desc: "The tool opens the OST file in a non-editable mode and makes sure that the original data stays same.",
    },
    {
      icon: Shield,
      title: "2. Secure Attachments Management",
      desc: "The attachments are showing safety without any kind of risk or threats externally.",
    },
    {
      icon: Shield,
      title: "3. Privacy focused",
      desc: "Our tool is developed to make sure that user data does not get shared or monitored by any other third parties.",
    },
    {
      icon: Archive,
      title: "4. No Data Retained",
      desc: "All the data is available during an active session and is deleted instantly after the end of the session.",
    },
  ];

  const features = [
    {
      icon: Globe,
      title: "1. Browser-Based Access",
      desc: "Ensure the structure of your OST file for smooth direction.",
    },
    {
      icon: Eye,
      title: "2. Enables Preview of Orphaned OST files",
      desc: "Open an orphaned OST file online. Simply open inaccessible or disconnected OST files without any complexities.",
    },
    {
      icon: FileText,
      title: "3. Read Only View",
      desc: "We make sure no changes are made to the authentic data while browsing file contents.",
    },
    {
      icon: Shield,
      title: "4. No Outlook Reliability",
      desc: "You do not need Microsoft Outlook or Exchange Server access. You can even easily open an orphaned OST file.",
    },
    {
      icon: Search,
      title: "5. Advanced Search Filters",
      desc: "Our tool offers advanced search options that enable users to import the OST Files by manually searching or by sorting through date, month, and year filters.",
    },
    {
      icon: Zap,
      title: "6. Fast Upload and Preview",
      desc: "Upload the OST file and begin to see mailbox data within a few seconds.",
    },
    {
      icon: Mail,
      title: "7. Entire Mailbox Visible",
      desc: "You can have access to emails, attachments, contacts, calendars, notes, and tasks in a proper format.",
    },
    {
      icon: Archive,
      title: "8. Preserves Original Hierarchy & Structure",
      desc: "Managing the same hierarchy with the OST Viewer Software.",
    },
  ];

  const steps = [
    {
      icon: Globe,
      num: "Step 1",
      title: "Open our OST Viewer in your browser",
      desc: "Introduce the tool in your browser, no OST Viewer, no software install needed. There is no requirement to download or install any software; our tool is developed for numerous browsers. It permits users to open OST files without any restrictions.",
    },
    {
      icon: Shield,
      num: "Step 2",
      title: "Upload the OST File Safely",
      desc: "Choose and upload the OST file via the saved interface with encrypted data transfer. The overall uploading process is saved utilizing upgraded encryption protocols, making sure data stays safe while transferring, with no difficulties.",
    },
    {
      icon: Cpu,
      num: "Step 3",
      title: "System Processes the File",
      desc: "The tool has an automated scan and analyzes the OST File. After the uploading process, our system starts to work automatically. It does a quick scan yet wide scan for the analysis of file format and to extract all mailbox elements.",
    },
    {
      icon: Search,
      num: "Step 4",
      title: "Quickly Preview and Discover Data",
      desc: "Preview OST mailbox data before migration and access to emails, attachments, contacts, calendars, and more in a well-structured way. Once the process is completed, you can quickly access and discover the data in a transparent interface. Directly via folders, emails, and preview the attachments.",
    },
  ];

  const reviews = [
    {
      name: "Michael Collins",
      role: "IT Support Specialist",
      text: "The online OST Viewer worked perfectly for me. I uploaded the file and was able to see all emails quickly without downloading anything.",
      stars: 5,
    },
    {
      name: "Jennifer Anderson",
      role: "System Administrator",
      text: "I wanted a reliable OST viewer, so I came across the OST Viewer tool, which is browser-based. Their tool processed my file instantly and managed the folder format.",
      stars: 5,
    },
    {
      name: "Laura Brooks",
      role: "Data Analyst",
      text: "I was really impressed by how quickly this OST Viewer tool processed my file. The huge OST files opened simply without any issue.",
      stars: 5,
    },
    {
      name: "Kevin Jenkins",
      role: "Compliance Officer",
      text: "For audit purposes, I required fast access to mailbox data without downloading software. Their Online OST viewer worked perfectly and kept everything in sequence.",
      stars: 5,
    },
    {
      name: "Emily Wilson",
      role: "IT Consultant",
      text: "I had an Orphaned OST file, and no Outlook was downloaded. The online viewer guided me to access quickly. The interface is user-friendly and simple to use.",
      stars: 5,
    },
    {
      name: "Julius Smith",
      role: "Corporate User",
      text: "The best area is security. The device processes safely and securely, and stores them temporarily. I was able to open OST file without IT support.",
      stars: 5,
    },
  ];

  const faqs = [
    {
      q: "Q1. Can I read an orphaned OST file online without an Exchange or Outlook profile?",
      a: "Yes, our tool permits opening and discovering OST files even authentic Exchange Server or Outlook profile is not needed.",
    },
    {
      q: "Q2. How does the Online OST viewer manage files after processing?",
      a: "The online OST viewer tool helps in processing the file in a safe environment and automatically deletes it after the process ends.",
    },
    {
      q: "Q3. Is it possible to view OST files generated from different Outlook versions?",
      a: "Yes, the tool supports OST files created by all important versions of Microsoft Outlook.",
    },
    {
      q: "Q4. Does the tool show deleted items in the OST file?",
      a: "Yes, our OST Viewer tool scans and shows deleted mailbox elements.",
    },
    {
      q: "Q5. Can I search a specific file to view?",
      a: "Yes, we offer an advanced search view feature where users can easily import and upload a specific file to view.",
    },
    {
      q: "Q6. What data can I see in the OST Viewer?",
      a: "We enable users to open, view, and read their OST Files in their structured format, including the email headers, body, attachments, etc., in the mail view mode.",
    },
    {
      q: "Q7. Can I export OST files from the OST Viewer?",
      a: "Our OST Viewer Online Tool enables users to view their OST Files. However, if you want to export your OST files, use our separate tool called the OST to PST Converter.",
    },
    {
      q: "Q8. How do I view an OST File without Exchange?",
      a: "Users can access the OST File Emails without an Exchange Server, using our OST Viewer Online Tool Content. This tool enables users to open, view, and read the OST Files for free.",
    },
    {
      q: "Q9. Can I view large OST Files Online Free 50 GB?",
      a: "Our tool allows users to view large OST files for free. You can simply browse your files, import, and open to read your OST Files.",
    },
  ];

  return (
    <div className="w-full font-sans">
      {/* ── Hero ───────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-50 via-white to-brand-50/40 pt-6 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-brand-100/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-violet-100/20 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-[11px] font-black text-brand-600 uppercase tracking-widest">
                  100% Browser-Based · No Install
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-[1.05] mb-6">
                Secure OST Viewer Online
              </h1>
              <div className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
                See, Open, and Analyze OST Files Effectively
              </div>
              <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8 max-w-lg">
                Our online free OST Viewer is a strong, easy-to-use solution
                that opens, reads, and analyzes OST files without requiring
                Microsoft Outlook. Built for simplicity, our tool shows quick
                access to mailbox data.
              </p>
              {/* <div className="flex flex-wrap gap-4 mb-8">
                <button className="px-6 py-3 rounded-full bg-brand-500 text-white font-bold hover:bg-brand-600 transition-colors">
                  Begin Free Trial
                </button>
                <button className="px-6 py-3 rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors">
                  Download Now
                </button>
              </div> */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  ["10+ Years", "Experience"],
                  ["24x7", "Customer Support"],
                  ["3 Million+", "Served"],
                ].map(([val, lab]) => (
                  <div key={lab}>
                    <div className="text-2xl font-black text-slate-900">
                      {val}
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {lab}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {[Shield, Clock, Globe].map((Icon, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm"
                  >
                    <Icon size={13} className="text-brand-500" />
                    <span className="text-[11px] font-bold text-slate-500">
                      {["Secure Processing", "Fast Preview", "Any Device"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <HeroUpload onSessionReady={onSessionReady} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Highlights ────────────────────────────────── */}
      <section className="py-20 px-4 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            label="Highlights"
            title="Key Highlights of our OST Viewer"
            sub="A complete set of tools to browse and examine your files."
          />
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-5">
            {[
              "No software installation or downloading required.",
              "Works from any modern web browser.",
              "Quick and precise OST File preview.",
              "View the OST file, email, and attachments.",
              "Manages original data format and sequence.",
              "Safe and secure cloud-based processing.",
              "Suitable for fast access and analysis.",
              "Open OST File Without Outlook Online Free",
              "Reduce the technical difficulties.",
              "Utilize our advanced search feature, where users can search for their file names and upload",
              "Easily separate the OST Files by sorting through our year, month, and date filters.",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={14} className="text-brand-500" />
                </div>
                <span className="text-slate-600 font-medium leading-relaxed">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Use ────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label="Why Choose Us"
            title="Secure and Reliable, our OST Viewer Online Tool"
            sub="The outdated OST viewers needed downloads and installation. We remove that barrier by offering a completely web-based experience."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-7 rounded-2xl border border-slate-200 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5 transition-all bg-white"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 mb-5 group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <item.icon size={22} />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label="Features"
            title="Main Features of our Online OST Viewer Tool"
            sub="Everything you need to open, browse, and understand your OST mailbox — no software required."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="p-7 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white mb-5">
                  <f.icon size={18} />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data Types ─────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#1e234c] mb-12">
            View & Read OST Mailbox With Free Outlook OST Viewer
          </h2>

          <div className="flex flex-col gap-8 items-center w-full max-w-5xl">
            {/* Tabs */}
            <div className="w-full overflow-x-auto pb-6 -mb-6 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex flex-row w-max min-w-full border border-slate-200 bg-white shadow-sm shrink-0">
                {dataTypesTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <div
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative flex-1 min-w-[130px] text-center cursor-pointer px-4 py-4 border-r border-slate-200 text-sm font-medium transition-colors last:border-r-0 whitespace-nowrap",
                        isActive
                          ? "bg-brand-500 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {tab.label}
                      {isActive && (
                        <div className="hidden md:block absolute -bottom-[12px] left-1/2 -translate-x-1/2 w-0 h-0 border-x-[12px] border-x-transparent border-t-[12px] border-t-brand-500 z-10" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="w-full bg-white pt-2 px-4 md:px-8 flex justify-center">
              {dataTypesTabs.map((tab) => {
                if (activeTab !== tab.id) return null;
                return (
                  <div key={tab.id} className="animate-in fade-in duration-300 w-full flex justify-center">
                    <div className="text-sm md:text-[15px] text-slate-600 leading-[1.8] max-w-3xl">
                      <span className="font-bold text-slate-800">
                        {tab.title}: -{" "}
                      </span>
                      {tab.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Need ───────────────────────────────── */}
      <section className="py-20 px-4 bg-brand-500">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-widest mb-6">
            Use Cases
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-8">
            Use Cases of the OST Viewer Tool
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Access Corrupted or Orphaned Files: Open, preview, and read the corrupted or Orphaned OST File.",
              "View OST File: Directly view the contents in an OST File.",
              "Recovery of Data: If the Outlook email account has been deleted, but the OST File exists.",
              "Restoration of Mailbox Details: To retrieve and restore all the mailbox data.",
              "Support Forensic Investigation: To read and examine during forensic analysis without any modifications.",
              "Access during Server downtime: If the whole mail server is suffering from downtime, and the user needs to access their emails.",
            ].map((item, i) => {
              const [title, ...rest] = item.split(":");
              const description = rest.join(":").trim();
              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center gap-3 bg-white/10 hover:bg-white/20 transition-all rounded-xl p-6 border border-white/20"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-1">
                    <Check size={24} className="text-white" />
                  </div>
                  <h3 className="text-white font-bold text-lg leading-snug">
                    {title}
                  </h3>
                  <p className="text-white/80 font-medium text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label="Process"
            title="How to use our OST Viewer?"
            sub="Beginning with how to open an OST file in your browser is fast, simple, and built for everyone."
          />
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative text-center px-8 pb-8 pt-10 rounded-2xl border border-slate-200 bg-white hover:shadow-xl transition-all group mt-4"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 px-4 rounded-full bg-brand-500 text-white text-xs font-black flex items-center justify-center shadow-lg shadow-brand-500/30 whitespace-nowrap">
                  {s.num}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500 mx-auto mb-5 mt-4 group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <s.icon size={24} />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-3">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <SectionHeading label="Customer Reviews" title="What Our Users Say" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all flex flex-col gap-4"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {r.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                    {r.role}
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed flex-1">
                  "{r.text}"
                </p>
                <div className="flex gap-0.5">
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      className="fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <SectionHeading
            label="Contact Us"
            title="Feel Free to Contact Us"
            sub="We are always here to help and answer all your questions."
          />
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-brand-500 text-white shadow-xl shadow-brand-500/30 cursor-pointer hover:bg-brand-600 transition-all">
            <Phone size={18} />
            <span className="font-black text-base">Get Experts' Help!</span>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <SectionHeading label="FAQ" title="Frequently Asked Questions" />
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default OSTViewerLanding;
