import React, { useState, useRef, useCallback } from "react";
import { useAuth, useClerk } from "@clerk/clerk-react";
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


// ─── Hero / Upload ───────────────────────────────────────────────────────────

const HeroUpload = ({ onSessionReady }) => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { openSignIn } = useClerk();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      const ext = file.name.split(".").pop().toLowerCase();
      if (!["ost", "pst"].includes(ext)) {
        toast.error("Only .ost and .pst files are supported.");
        return;
      }
      const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
      if (file.size > MAX_SIZE) {
        setShowUpgradeModal(true);
        return;
      }
      setUploading(true);
      setProgress({ phase: "init", percent: 0, detail: "Initializing..." });
      try {
        const result = await fileService.uploadFile(file, getToken, (info) => setProgress(info), null, null, null);
        onSessionReady({ sessionId: result.sessionId, originalFileName: result.originalFileName || file.name, size: file.size });
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
      accept=".ost,.pst"
      className="hidden"
      onChange={handleFileInputChange}
    />

    <div className="flex flex-col items-center gap-6 sm:gap-8 lg:gap-6">
      
      {/* ICON */}
      <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-24 lg:h-24 flex items-center justify-center">
        <CloudUpload size={96} className="w-full h-full text-slate-900 stroke-[1.2]" />
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

      {/* FOOTER TEXT */}
      <div className="flex flex-col gap-3">
        <p className="text-xs sm:text-sm font-bold tracking-tight">
          Supports .ost/.pst files · Max 5GB
        </p>
        <p className="text-xs sm:text-sm text-slate-900 font-medium">
          Secure upload · No data stored
        </p>
      </div>

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
    {label && <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-[11px] font-black uppercase tracking-widest mb-4">{label}</div>}
    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">{title}</h2>
    {sub && <p className="text-base md:text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">{sub}</p>}
  </div>
);

// ─── FAQ Item ────────────────────────────────────────────────────────────────

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-slate-50 transition-colors gap-4">
        <span className="font-bold text-slate-800 text-sm md:text-base leading-snug">{q}</span>
        <ChevronDown size={18} className={cn("shrink-0 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <div className="px-6 pb-5 text-sm md:text-base text-slate-500 font-medium leading-relaxed bg-white">{a}</div>}
    </div>
  );
};

// ─── Main Landing ─────────────────────────────────────────────────────────────

const OstViewerLanding = ({ onSessionReady }) => {
  const whyItems = [
    { icon: Monitor, title: "Secure and Reliable", desc: "Our OST Viewer makes sure entire data safety through the process. Files get processed in a safe environment, without storing any data." },
    { icon: Globe, title: "24x7 Accessibility Support", desc: "We offer 24/7 accessibility support anytime and anywhere without any limitations. Our tool guides you to see the data quickly." },
    { icon: Zap, title: "No File Size Limitation", desc: "Our OST Viewer tool permits you to upload and see OST files of any size. It does not matter if it is a small file or a large file; we manage effectively." },
    { icon: WifiOff, title: "Supports in multiple browsers", desc: "We provide a web-based OST viewer that works on all the major browsers like Chrome, Edge, Firefox, and Safari." },
    { icon: Eye, title: "Open OST File without Outlook", desc: "Simply access OST files without requiring Outlook or an Exchange Server, which makes it easy when the setup is not available." },
    { icon: Eye, title: "Quick preview of Mailbox Data", desc: "Fastly see emails, attachments, contacts, calendars, and folder formats without any kind of delay." },
    ];

  const features = [
    { icon: Upload, title: "Quickly Open OST Files", desc: "Upload your OST file and begin viewing data immediately. Our platform processes the file safely and displays all mailbox content in a structured way." },
    { icon: Archive, title: "Discover Full Mailbox Data", desc: "Access all OST file elements: emails, attachments, contacts, calendars, notes, and tasks — shown in an authentic, structured format." },
    { icon: Mail, title: "Preview Emails with Complete Details", desc: "Every email shows full properties — sender, recipient, subject, and message body — ensuring a transparent and accurate experience." },
    { icon: Search, title: "Upgraded Search and Filters", desc: "Instantly find emails using advanced filters like sender, subject, or date. Especially useful when working with large OST files." },
    { icon: Paperclip, title: "View Attachments without Installation", desc: "View email attachments in the browser without downloading them separately, making quick review safe and easy." },
    { icon: Cpu, title: "Handles Huge OST Files", desc: "Optimised to process large OST files efficiently, ensuring smooth performance without slowing down your system." },
  ];

  const dataTypes = [
    { icon: Mail, color: "bg-brand-500", title: "Emails", desc: "View emails with full properties, HTML structure, images, and signatures. Supports all email message elements." },
    { icon: Paperclip, color: "bg-violet-500", title: "Attachments", desc: "Full file preview of OST mailbox attachments. Supports TXT, DOC, JPEG, PNG, MP3, MP4, and many more formats." },
    { icon: Users, color: "bg-emerald-500", title: "Contacts", desc: "Export Outlook contacts with all details: name, address, phone, email ID, photo, and more — without losing any information." },
    { icon: Calendar, color: "bg-orange-500", title: "Calendars", desc: "View OST calendars in ICS format with full schedule details including events, meetings, tasks, and appointments." },
  ];

  const steps = [
    { icon: Upload, num: "01", title: "Upload OST File", desc: "Choose and upload your OST file via the browser. No software download needed — just a few clicks and you're ready." },
    { icon: Cpu, num: "02", title: "Automatic Data Processing", desc: "Once uploaded, our tool safely processes your file, scanning and organising all mailbox data while maintaining the original structure." },
    { icon: Eye, num: "03", title: "Fast Mailbox Preview", desc: "Browse folders, emails, and attachments directly through a clean, user-friendly interface — no waiting, no installation." },
  ];

  const reviews = [
    { name: "Michael Collins", role: "IT Manager", text: "We manage OST files and earlier downloaded various tools across systems. Now everything works in the browser. I upload and see emails within minutes. Quick, dependable, and built for an online environment.", stars: 5 },
    { name: "Jessica Turner", role: "System Administrator", text: "I had an orphaned OST file that required immediate access, and the tool made the entire procedure easy. The interface is user-friendly and I opened the OST file without any IT support.", stars: 5 },
    { name: "David Brooks", role: "Network Engineer", text: "Impressed that we don't have to rely on Outlook. Uploading the OST file quickly and previewing mailbox data before migration saved me a lot of time.", stars: 5 },
    { name: "Amanda Reynolds", role: "Operations Manager", text: "Our team needs to review archived email data regularly, and this is a perfect solution. Web-based access makes it simple for everyone, even non-technical users.", stars: 5 },
  ];

  const faqs = [
    { q: "What is OST Viewer Online?", a: "OST Viewer is a browser-based tool that lets you view OST files before converting to PST without downloading any software. Simply upload the file and access your email data directly in the browser." },
    { q: "Do I need Outlook to open OST files online?", a: "No, you don't need Outlook or an Exchange Server. Our tool works independently, allowing access to orphaned or archived OST file emails without any email client." },
    { q: "Is it important to install any software?", a: "No installation or download is needed. Everything works fully in the browser, saving your time and system resources." },
    { q: "What kind of data can I see in my OST file?", a: "You can preview all mailbox items including emails, contacts, attachments, calendars, and tasks. The tool maintains the original file structure and format." },
    { q: "Is my data safe while using your OST viewer?", a: "Yes. We prioritise data security. Files are processed safely with temporary data storage, and the entire process is built to ensure your privacy." },
    { q: "Does your tool support orphaned OST files?", a: "Yes. Our tool fully supports orphaned and corrupted OST files, allowing you to retrieve and view your data seamlessly." },
    { q: "How long does it take to view an OST file?", a: "It depends on file size, but most OST files are processed within seconds, letting you start browsing almost immediately." },
    { q: "Can I view attachments in the OST file?", a: "Yes. View email attachments directly in the browser without installing anything extra — quickly and safely." },
  ];

  return (
    <div className="w-full font-sans">
      {/* ── Hero ───────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-50 via-white to-brand-50/40 pt-10 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-brand-100/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-violet-100/20 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-[11px] font-black text-brand-600 uppercase tracking-widest">100% Browser-Based · No Install</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-[1.05] mb-6">
                OST Viewer <span className="text-brand-500">Online</span>
              </h1>
              <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8 max-w-lg">
                See OST files quickly in your browser — no installation needed. Get access to your Outlook OST files anytime, anywhere with our powerful browser-based viewer.
              </p>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[["1 Million+", "Satisfied Customers"], ["100%", "Safe & Secure"], ["10+ Years", "Experience"]].map(([val, lab]) => (
                  <div key={lab}>
                    <div className="text-2xl font-black text-slate-900">{val}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{lab}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {[Shield, Clock, Globe].map((Icon, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
                    <Icon size={13} className="text-brand-500" />
                    <span className="text-[11px] font-bold text-slate-500">{["Secure Processing", "Fast Preview", "Any Device"][i]}</span>
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

      {/* ── Why Use ────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionHeading label="Why Choose Us" title="Why Use Our OST Viewer Online?" sub="The outdated OST viewers needed downloads and installation. We remove that barrier by offering a completely web-based experience." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyItems.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group p-7 rounded-2xl border border-slate-200 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5 transition-all bg-white">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 mb-5 group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <item.icon size={22} />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <SectionHeading label="Features" title="Features of Our OST Viewer" sub="Everything you need to open, browse, and understand your OST mailbox — no software required." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="p-7 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white mb-5">
                  <f.icon size={18} />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data Types ─────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionHeading label="Mailbox Data" title="Open and View OST Mailbox Data" sub="Preview every type of data stored in your OST file with full fidelity — exactly as it was in Outlook." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dataTypes.map((d, i) => (
              <div key={i} className="p-7 rounded-2xl border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all text-center group">
                <div className={`w-14 h-14 ${d.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                  <d.icon size={24} />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">{d.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Need ───────────────────────────────── */}
      <section className="py-20 px-4 bg-brand-500">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-widest mb-6">Use Cases</div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-8">Why Need OST Viewer?</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              "When Outlook is not installed in the system",
              "Lost Exchange Server connection",
              "Open orphaned OST files online",
              "Need to instantly access archived email data",
              "Damaged or inaccessible OST file",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/10 rounded-xl p-4 border border-white/20">
                <Check size={16} className="text-white mt-0.5 shrink-0" />
                <span className="text-white font-medium text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeading label="Process" title="Our OST Viewer Work Process" sub="Beginning with how to open an OST file in your browser is fast, simple, and built for everyone — just three steps." />
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="relative text-center p-8 rounded-2xl border border-slate-200 bg-white hover:shadow-xl transition-all group">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-brand-500 text-white text-xs font-black flex items-center justify-center shadow-lg shadow-brand-500/30">{s.num}</div>
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500 mx-auto mb-5 mt-4 group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <s.icon size={24} />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-3">{s.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <SectionHeading label="Customer Reviews" title="What Our Users Say" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all flex flex-col gap-4">
               
                <div>
                  <div className="font-bold text-slate-900 text-sm">{r.name}</div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{r.role}</div>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed flex-1">"{r.text}"</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: r.stars }).map((_, j) => <Star key={j} size={14} className="fill-amber-400 text-amber-400" />)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <SectionHeading label="Contact Us" title="Feel Free to Contact Us" sub="We are always here to help and answer all your questions." />
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
            {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>
    </div>
  );
};

export default OstViewerLanding;
