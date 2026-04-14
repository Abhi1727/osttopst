import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const FORMATS = [
  {
    ext: "PST",
    bg: "bg-brand-700",
    description:
      "Convert to PST and access your Outlook data for simple access, import, and backup.",
  },
  {
    ext: "MSG",
    bg: "bg-brand-900",
    description:
      "Import the Emails in their complete Outlook format while preserving formatting, attachments, and metadata.",
  },
  {
    ext: "EML",
    bg: "bg-green-700",
    description:
      "Save the Emails in a widely supported format that works on email clients without any compatibility problems.",
  },
  {
    ext: "PDF",
    bg: "bg-red-800",
    description:
      "Save your emails in a professional format that's perfect for sharing, printing, and compliance.",
  },
  {
    ext: "DOCX",
    bg: "bg-brand-800",
    description:
      "Convert emails into fully editable Word files, suitable for documentation, editing, and reporting.",
  },
  {
    ext: "HTML",
    bg: "bg-emerald-600",
    description:
      "View and share emails as web pages that open simply in any browser with structured formatting.",
  },
  {
    ext: "MBox",
    bg: "bg-brand-700",
    description:
      "Easily move your emails to a platform like Apple Mail or Thunderbird with full data cohesion.",
  },
  {
    ext: "CSV",
    bg: "bg-green-600",
    description:
      "Export email data and contacts into a spreadsheet structure for filtering, sorting, and analysis.",
  },
  {
    ext: "XML",
    bg: "bg-brand-600",
    description:
      "Collect email data in a format ideal for system integration and technical work processes.",
  },
  {
    ext: "JSON",
    bg: "bg-brand-500",
    description:
      "Get transparent, properly structured data output, which is made for developers and modern application use.",
  },
  {
    ext: "VCF",
    bg: "bg-brand-600",
    description:
      "Transfer your contacts quickly to any device or email application without any issues.",
  },
  {
    ext: "ICS",
    bg: "bg-brand-600",
    description:
      "Save calendar events with full information, making it simple to import into any calendar application.",
  },
  {
    ext: "TXT",
    bg: "bg-slate-500",
    description:
      "Save your emails as normal plain text files for fast access, lightweight storage, and easy readability.",
  },
  {
    ext: "RTF",
    bg: "bg-pink-600",
    description:
      "Save simple formatting while making sure the compatibility across several platforms and applications.",
  },
  {
    ext: "EMLX",
    bg: "bg-zinc-700",
    description:
      "Convert emails for a seamless experience in Apple Mail without overlooking structure and attachments.",
  },
  {
    ext: "OLM",
    bg: "bg-brand-400",
    description:
      "Move mailbox data to the Mac Outlook structure with easy compatibility and simple import.",
  },
  {
    ext: "OFT",
    bg: "bg-brand-500",
    description:
      "Generate Outlook email templates to reuse content and enable fast communication.",
  },
];

const FormatMarquee = () => {
  const [showAll, setShowAll] = useState(false);
  const displayedFormats = showAll ? FORMATS : FORMATS.slice(0, 12);

  return (
    <section className="py-12 bg-brand-50">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="mb-8">
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight leading-relaxed">
            Convert OST files to{" "}
            <span className="text-brand-600">16+ Popular Formats</span>{" "}
            effortlessly
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
          
            {displayedFormats.map((item, index) => (
              <div
                key={item.ext}
                className="flex items-start gap-4 group cursor-default"
              >
                <div
                  className={`w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-xl ${item.bg} flex items-center justify-center shadow-lg transition-transform group-hover:scale-105`}
                >
                  <span className="text-white text-[10px] md:text-xs font-black tracking-tighter uppercase px-1 text-center">
                    {item.ext}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-600 text-[13px] md:text-sm leading-relaxed font-normal">
                   
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
         
        </div>

        {FORMATS.length > 12 && (
          <div className="mt-10 flex justify-center">
            <Button
              onClick={() => setShowAll(!showAll)}
              className="h-12 md:h-14 px-8 md:px-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-3 shadow-xl transition-all active:scale-95 group overflow-hidden"
            >
              {showAll ? (
                <>
                  Show Less{" "}
                  <ChevronUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                </>
              ) : (
                <>
                  Load More Formats{" "}
                  <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FormatMarquee;
