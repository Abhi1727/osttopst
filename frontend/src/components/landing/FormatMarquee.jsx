import React from "react";
import {
  FileText,
  Mail,
  FileCode,
  FolderX,
  History,
  FileSearch,
  ArrowRight,
} from "lucide-react";

const FORMATS = [
  { name: "PST", icon: History, color: "text-[#0ea5e9]", bg: "bg-blue-50" },
  { name: "PDF", icon: FileText, color: "text-red-500", bg: "bg-red-50" },
  { name: "EML", icon: Mail, color: "text-emerald-500", bg: "bg-emerald-50" },
  { name: "MSG", icon: FileSearch, color: "text-violet-500", bg: "bg-violet-50" },
  { name: "DOC", icon: FileText, color: "text-blue-700", bg: "bg-blue-50" },
  { name: "JSON", icon: FileCode, color: "text-amber-500", bg: "bg-amber-50" },
  { name: "MBOX", icon: FolderX, color: "text-rose-500", bg: "bg-rose-50" },
  { name: "TXT", icon: FileText, color: "text-slate-500", bg: "bg-slate-50" },
];

const FormatMarquee = () => {
  return (
    <section className="py-12 md:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-3">
          Export to Multiple Formats
        </h2>
        <p className="text-slate-500 font-semibold text-base md:text-lg max-w-2xl mx-auto">
          Whatever your destination, we've got you covered with high-fidelity
          conversion.
        </p>
      </div>

      <div className="relative flex overflow-x-hidden group">
        <div className="flex animate-marquee whitespace-nowrap py-8 md:py-12">
          {/* Double the list to create infinite effect */}
          {[...FORMATS, ...FORMATS].map((format, index) => (
            <div
              key={index}
              className="inline-flex flex-col items-center justify-center mx-4 md:mx-6 min-w-[120px] md:min-w-[160px] p-4 md:p-6 rounded-[24px] md:rounded-[32px] bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-2 cursor-default group/item"
            >
              <div className={`w-14 h-14 md:w-20 md:h-20 ${format.bg} rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 group-hover/item:scale-110 transition-transform`}>
                <format.icon className={`w-7 h-7 md:w-10 md:h-10 ${format.color}`} />
              </div>
              <span className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
                {format.name}
              </span>
            </div>
          ))}
        </div>

        {/* Gradient overlays for smooth fade edges */}
        <div className="absolute top-0 bottom-0 left-0 w-32 md:w-64 bg-gradient-to-r from-[#f0f9ff] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-32 md:w-64 bg-gradient-to-l from-[#f0f9ff] to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  );
};

export default FormatMarquee;
