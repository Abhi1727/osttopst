import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FaqItem = ({ question, answer }) => (
  <div className="group relative flex flex-col space-y-3">
    <div className="absolute -left-6 top-1 w-1 h-0 bg-brand-500 transition-all duration-500 group-hover:h-full opacity-50 overflow-hidden rounded-full"></div>
    <h3 className="font-bold text-slate-900 tracking-tight leading-snug group-hover:text-brand-700 transition-colors">
      {question}
    </h3>
    <p className="text-slate-600 leading-relaxed font-medium opacity-90">
      {answer}
    </p>
    <div className="pt-1">
      <div className="h-px w-20 bg-brand-100 group-hover:w-full transition-all duration-700"></div>
    </div>
  </div>
);

const LandingFaq = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans min-h-screen flex flex-col justify-center py-20">
      {/* Header Section */}
      <div className="pb-6 md:pb-8 px-4 text-center relative overflow-hidden">
        {/* Background Blobs matching Faq.jsx */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <h1 className="font-bold text-slate-900 mb-4 tracking-tight">
          Frequently Asked <span className="text-brand-600">Questions</span>
        </h1>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 w-full flex-1 pb-10 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          <FaqItem 
            question="What is an OST file?"
            answer="An OST file, which stands for Offline Outlook Data File, is a setup mirror or a 'cache' of what’s currently on the mail server. It permits you to work offline and syncs modifications once you're back online."
          />
          <FaqItem 
            question="What is a PST file?"
            answer="A PST file, which stands for Personal Storage Table, acts like a personal filing cabinet for emails, calendar events, and contacts. It is gathered on a hard drive and is free of the server."
          />
          <FaqItem 
            question="How do I Import an OST File into Outlook PST?"
            answer="Outlook doesn't directly import OST files. First, you must convert the OST to a PST format. Once it gets converted, you can utilize Outlook's 'Import/Export' wizard to bring out the PST data into your profile."
          />
          <FaqItem 
            question="How to convert OST to PST online?"
            answer="You can utilize our safe and secure online service. Just simply add your OST file, our cloud-based engine will process it quickly, managing your folder structure, and then you can download or install the PST file."
          />
          <FaqItem 
            question="What is the migrate emails OST to PST converter tool?"
            answer="It is a characterized utility built to unlock 'orphaned' OST files and convert them into standard PST files that can be opened by any Outlook version."
          />
          <FaqItem 
            question="How to open an OST File without Outlook?"
            answer="OST files are locked to the MAPI profile that generated them. To see the data without the original Outlook account, you must convert it to a PST or utilize an OST viewer tool."
          />
          <FaqItem 
            question="Is the OST TO PST converter safe?"
            answer="Our online viewer and converter use 256-bit SSL encryption. Unlike many 'free' downloadable tools that may harbor malware, our cloud-based process makes sure your data stays in a safe and secure pipeline."
          />
          <FaqItem 
            question="Does the new Outlook still use OST files?"
            answer="Yes, the contemporary 'New Outlook' for Windows and Office 365 continues to utilize a local cache for offline access and performance, which is stored in a format similar to the outdated OST."
          />
      
        </div>
      </div>

      {/* Footer Banner */}
      <div className="max-w-6xl mx-auto px-4 w-full mb-10">
        <div className="bg-brand-700 rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-brand-900/10">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

          <div className="relative z-10 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
              Couldn't find what you needed?
            </h2>
            <p className="text-brand-100 text-sm md:text-base max-w-lg">
              Submit a support ticket and we'll get back to you within 24 hours.
            </p>
          </div>

          <div className="relative z-10 flex gap-4">
            <Button
              className="bg-white text-brand-700 hover:bg-brand-50 font-bold h-12 px-6 rounded-lg shadow-lg"
              onClick={() => navigate("/support")}
            >
              Contact Support
            </Button>
            <Button
              variant="outline"
              className="bg-brand-800/50 text-white border-brand-600 hover:bg-brand-800 hover:text-white font-bold h-12 px-6 rounded-lg"
              onClick={() => console.log("Live Chat")}
            >
              Live Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingFaq;
