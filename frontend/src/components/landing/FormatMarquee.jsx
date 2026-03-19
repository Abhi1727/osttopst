import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Mail,
  FileCode,
  FolderX,
  History,
  FileSearch,
  Sparkles,
  X,
  Globe,
  Type,
  Table,
  Terminal,
  Contact,
  Calendar,
  FileJson,
  Apple,
  Laptop,
  FileClock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FORMAT_DETAILS = {
  PST: {
    title: "OST to PST Conversion",
    description: "Convert to PST and access your Outlook data for simple access, import, and backup.",
  },
  EML: {
    title: "OST to EML Export",
    description: "Save the Emails in a widely supported format that works on email clients without any compatibility problems.",
  },
  MSG: {
    title: "OST to MSG Export",
    description: "Import the Emails in their complete Outlook format while preserving formatting, attachments, and metadata.",
  },
  PDF: {
    title: "OST to PDF Export",
    description: "Protect your emails in a professional format that's perfect for sharing, printing, and compliance.",
  },
  DOCX: {
    title: "OST to DOCX Export",
    description: "Convert emails into fully editable Word files, suitable for documentation, editing, and reporting.",
  },
  HTML: {
    title: "OST to HTML Export",
    description: "Observe and share emails as web pages that open simply in any browser with structured formatting.",
  },
  MBox: {
    title: "OST to MBox Migration",
    description: "Easily move your emails to a platform like Apple Mail or Thunderbird with full data cohesion.",
  },
  CSV: {
    title: "OST to CSV Export",
    description: "Export email data and contacts into a spreadsheet structure for filtering, sorting, and analysis.",
  },
  XML: {
    title: "OST to XML Export",
    description: "Collect email data in a format ideal for system integration and technical work processes.",
  },
  JSON: {
    title: "OST to JSON Data",
    description: "Get transparent, properly structured data output, which is made for developers and modern application use.",
  },
  TXT: {
    title: "OST to Text Export",
    description: "Protect emails as normal plain text files for fast access, lightweight storage, and easy readability.",
  },
  RTF: {
    title: "OST to RTF Export",
    description: "Save simple formatting while making sure the compatibility across several platforms and applications.",
  },
  VCF: {
    title: "OST to VCF (vCard)",
    description: "Transfer your contacts quickly to any device or email application without any issues.",
  },
  ICS: {
    title: "OST to ICS (iCalendar)",
    description: "Protect calendar events with full information, making it simple to import into any calendar application.",
  },
  EMLX: {
    title: "OST to EMLX Export",
    description: "Convert emails for unforgettable use in Apple Mail without overlooking structure and attachments.",
  },
  OLM: {
    title: "OST to OLM Migration",
    description: "Move mailbox data to the Mac Outlook structure with easy compatibility and simple import.",
  },
  OFT: {
    title: "OST to OFT Export",
    description: "Generate Outlook email templates to reuse content and enable fast communication.",
  },
};

const FORMATS = [
  { name: "PST", icon: History, color: "text-[#0ea5e9]", bg: "bg-blue-50", border: "border-blue-100" },
  { name: "EML", icon: Mail, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
  { name: "MSG", icon: FileSearch, color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100" },
  { name: "PDF", icon: FileText, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
  { name: "DOCX", icon: FileText, color: "text-blue-800", bg: "bg-blue-50", border: "border-blue-100" },
  { name: "HTML", icon: Globe, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
  { name: "MBox", icon: FolderX, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
  { name: "CSV", icon: Table, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  { name: "XML", icon: Terminal, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100" },
  { name: "JSON", icon: FileJson, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
  { name: "TXT", icon: FileText, color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200" },
  { name: "RTF", icon: Type, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  { name: "VCF", icon: Contact, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
  { name: "ICS", icon: Calendar, color: "text-teal-500", bg: "bg-teal-50", border: "border-teal-100" },
  { name: "EMLX", icon: Apple, color: "text-slate-800", bg: "bg-slate-50", border: "border-slate-200" },
  { name: "OLM", icon: Laptop, color: "text-blue-900", bg: "bg-blue-50", border: "border-blue-100" },
  { name: "OFT", icon: FileClock, color: "text-brand-600", bg: "bg-brand-50", border: "border-brand-100" },
];

const FormatMarquee = () => {
  const [hoveredFormat, setHoveredFormat] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = (format, index) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredFormat({ ...format, id: `${format.name}-${index}` });
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredFormat(null);
  };

  useEffect(() => {
    if (hoveredFormat) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [hoveredFormat]);

  return (
    <section className="py-10 md:py-14 overflow-hidden relative bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-6 text-center mb-6 md:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Export to Multiple Formats
          </h2>
          <p className="text-slate-500 font-medium text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Hover over any format to see the "Zoom Mode" detailed conversion
            guide.
          </p>
        </motion.div>
      </div>

      <div className="relative">
        {/* Marquee Body */}
        <div
          className={`flex overflow-x-hidden group transition-all duration-700 ${hoveredFormat ? "opacity-20 blur-xl scale-[0.97]" : "opacity-100 group-hover:[animation-play-state:paused]"}`}
        >
          <div
            className="flex animate-marquee py-4 whitespace-nowrap will-change-transform"
            style={{ transform: "translateZ(0)" }}
          >
            {[...FORMATS, ...FORMATS].map((format, index) => (
              <motion.div
                key={`${format.name}-${index}`}
                layoutId={`card-${format.name}-${index}`}
                onMouseEnter={() => handleMouseEnter(format, index)}
                className="inline-flex flex-col items-center justify-center mx-4 md:mx-6 min-w-[130px] md:min-w-[160px] p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] transition-all cursor-default group/item"
              >
                <div
                  className={`w-14 h-14 md:w-20 md:h-20 ${format.bg} rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mb-4 md:mb-6 shadow-inner border ${format.border} group-hover/item:scale-110 transition-transform duration-500`}
                >
                  <format.icon
                    className={`w-7 h-7 md:w-10 md:h-10 ${format.color}`}
                  />
                </div>
                <span className="text-base md:text-lg font-semibold text-slate-800 tracking-tight">
                  {format.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Global Overlay Experience */}
        <AnimatePresence>
          {hoveredFormat && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleMouseLeave}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl"
              />

              <motion.div
                layoutId={`card-${hoveredFormat.id}`}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15, filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onMouseLeave={handleMouseLeave}
                className="relative w-full max-w-lg md:max-w-xl bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] border-4 border-white overflow-hidden pointer-events-auto"
              >
                <div className="p-6 md:p-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
                  <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-center md:items-start text-center md:text-left">
                    <div
                      className={`w-20 h-20 md:w-28 md:h-28 shrink-0 ${hoveredFormat.bg} rounded-[2rem] flex items-center justify-center shadow-lg border-2 ${hoveredFormat.border} rotate-3`}
                    >
                      <hoveredFormat.icon
                        className={`w-10 h-10 md:w-14 md:h-14 ${hoveredFormat.color}`}
                      />
                    </div>

                    <div className="space-y-5 flex-1">
                      <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                          <span
                            className={`px-2.5 py-1 rounded-full ${hoveredFormat.bg} ${hoveredFormat.color} text-[9px] font-semibold uppercase tracking-widest border ${hoveredFormat.border}`}
                          >
                            LIVE ZOOM MODE
                          </span>
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                          {FORMAT_DETAILS[hoveredFormat.name].title}
                        </h3>
                      </div>

                      <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed opacity-90">
                        {FORMAT_DETAILS[hoveredFormat.name].description}
                      </p>

                      {/* <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping shrink-0" />
                        <span className="text-xs md:text-sm font-semibold text-slate-700 italic leading-snug">
                          "{FORMAT_DETAILS[hoveredFormat.name].tip}"
                        </span>
                      </div> */}

                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-4">
                        Move mouse away to close
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleMouseLeave}
                  className="absolute top-6 right-6 p-2 rounded-full bg-slate-100/50 hover:bg-slate-100 transition-colors md:hidden text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Side Gradients */}
        <div className="absolute top-0 bottom-0 left-0 w-32 md:w-64 bg-gradient-to-r from-white/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-32 md:w-64 bg-gradient-to-l from-white/90 to-transparent z-10 pointer-events-none" />
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </section>
  );
};

export default FormatMarquee;
