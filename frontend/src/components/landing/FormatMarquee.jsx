import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const FORMATS = [
  {
    ext: "PST",
    bg: "bg-brand-700",
    description:
      "PST is Outlook's native storage format. It's the standard for archiving and moving Outlook data between accounts.",
  },
  {
    ext: "MSG",
    bg: "bg-brand-900",
    description:
      "MSG is the individual Outlook message format. Perfect for saving single emails with all their attachments and metadata.",
  },
  {
    ext: "EML",
    bg: "bg-green-700",
    description:
      "EML is a widely accepted email format used by many email clients like Thunderbird, Apple Mail, and Windows Mail.",
  },
  {
    ext: "PDF",
    bg: "bg-red-800",
    description:
      "PDF is the most popular format for document sharing. Ideal for archiving emails in a non-editable, readable format.",
  },
  {
    ext: "DOCX",
    bg: "bg-brand-800",
    description:
      "DOCX is the Microsoft Word format. Best for when you need to edit the content of your emails in a word processor.",
  },
  {
    ext: "HTML",
    bg: "bg-emerald-600",
    description:
      "HTML allows you to view your emails in any web browser while preserving all formatting and structure.",
  },
  {
    ext: "MBox",
    bg: "bg-brand-700",
    description:
      "MBox is a generic mailbox format used by Unix and many open-source email clients to store multiple messages.",
  },
  {
    ext: "CSV",
    bg: "bg-green-600",
    description:
      "CSV is ideal for exporting contact lists or email headers for analysis in spreadsheet software like Excel.",
  },
  {
    ext: "XML",
    bg: "bg-brand-600",
    description:
      "XML is used for structured data that needs to be imported into other technical systems or custom databases.",
  },
  {
    ext: "JSON",
    bg: "bg-brand-500",
    description:
      "JSON is a modern, lightweight data format used by developers for web applications and API integrations.",
  },
  {
    ext: "VCF",
    bg: "bg-brand-600",
    description:
      "VCF (vCard) is the standard format for electronic business cards, allowing easy contact transfer to any device.",
  },
  {
    ext: "ICS",
    bg: "bg-brand-600",
    description:
      "ICS (iCalendar) protects calendar events with full details, making it simple to import into any calendar app.",
  },
  {
    ext: "TXT",
    bg: "bg-slate-500",
    description:
      "Plain Text format that preserves text content without any formatting for maximum universal compatibility.",
  },
  {
    ext: "RTF",
    bg: "bg-pink-600",
    description:
      "Rich Text Format that retains basic text styling and layout while being compatible across various software.",
  },
  {
    ext: "EMLX",
    bg: "bg-zinc-700",
    description:
      "Apple Mail's native email format, perfect for users who are migrating their data to a Mac environment.",
  },
  {
    ext: "OLM",
    bg: "bg-brand-400",
    description:
      "Mac Outlook's database format, the standard for moving Outlook data between Windows and Mac versions.",
  },
  {
    ext: "OFT",
    bg: "bg-brand-500",
    description:
      "Outlook File Template used to save emails as reusable templates for consistent and professional communication.",
  },
];

const FormatMarquee = () => {
  const [showAll, setShowAll] = useState(false);
  const displayedFormats = showAll ? FORMATS : FORMATS.slice(0, 12);

  return (
    <section className="py-20 bg-brand-50">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="mb-12">
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight leading-relaxed">
            Convert OST files to{" "}
            <span className="text-brand-600">17+ Popular Formats</span>{" "}
            effortlessly
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
          <AnimatePresence mode="popLayout">
            {displayedFormats.map((item, index) => (
              <motion.div
                key={item.ext}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{
                  layout: { type: "spring", stiffness: 200, damping: 25 },
                  duration: 0.3,
                  delay: showAll ? 0 : index * 0.03,
                }}
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
                    <span className="font-bold text-slate-800">{item.ext}</span>{" "}
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {FORMATS.length > 12 && (
          <div className="mt-16 flex justify-center">
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
