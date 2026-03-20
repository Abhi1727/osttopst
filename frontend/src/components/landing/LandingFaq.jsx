import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const FaqItem = ({ number, question, answer, isOpen, onClick }) => (
  <div className="bg-white overflow-hidden">
    <button
      onClick={onClick}
      className="w-full flex items-start sm:items-center justify-between p-5 sm:p-6 md:p-8 text-left hover:bg-slate-50 transition-colors gap-3 sm:gap-4"
    >
      <span className="text-slate-800 font-bold text-base sm:text-lg md:text-xl flex items-start sm:items-center gap-2 sm:gap-4">
        <span className="text-slate-400 font-medium mt-0.5 sm:mt-0">{number}.</span>
        <span>{question}</span>
      </span>
      <ChevronDown className={`w-5 h-5 sm:w-6 sm:h-6 text-slate-400 shrink-0 mt-1 sm:mt-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    <div className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}>
      <div className="p-5 sm:p-6 md:p-8 pt-0 text-slate-600 font-medium leading-relaxed text-sm sm:text-base md:text-lg max-w-4xl">
        {answer}
      </div>
    </div>
  </div>
);

const LandingFaq = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "What is an OST file?",
      answer: "An OST file, which stands for offline outlook data files, is a setup mirror or a cache of what's currently on the mail server. It permits you to work offline and sync modifications once you're back online.",
    },
    {
      question: "What is a PST file?",
      answer: "A PST file, which stands for Personal Storage Table, acts like a personal filing cabinet for emails, calendar events, and contacts. It is gathered on a hard drive and is free of the server.",
    },
    {
      question: "How do I Import an OST File into Outlook PST ?",
      answer: "Outlook doesn't directly import OST files. First, you must convert the OST to a PST format. Once it gets converted, you can utilize Outlook's 'Import/Export' wizard to bring out the PST data into your profile.",
    },
    {
      question: "How to convert OST to PST online?",
      answer: "You can utilize our safe and secure online service. Just simply add your OST file, our cloud-based engine will process it quickly, managing your folder structure, and then you can download or install the PST file.",
    },
    {
      question: "What is the migrate emails OST to PST converter tool?",
      answer: "It is a characterized utility built to unlock 'orphaned' OST files and convert them into standard PST files that can be opened by any Outlook version.",
    },
    {
      question: "How to open an OST File without Outlook?",
      answer: "OST files are locked to the MAPI profile that generated them. To see the data without the original Outlook account, you must convert it to a PST or utilize an OST viewer tool.",
    },
    {
      question: "Is the OST to PST converter safe?",
      answer: "Our online viewer and converter use 256-bit SSL encryption. Unlike many 'free' downloadable tools that may harbor malware, our cloud-based process makes sure your data stays in a safe and secure pipeline.",
    },
    {
      question: "Does the new Outlook still use OST files?",
      answer: "Yes, the contemporary 'New Outlook' for Windows and Office 365 continues to utilize a local cache for offline access and performance, which is stored in a format similar to the outdated OST.",
    },
  ];

  return (
    <section className="bg-[#f0f9ff] py-16 md:py-24 px-4 md:px-6 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-12 md:space-y-16">
        <div className="space-y-6 md:space-y-8">
          <h2 className="text-brand-500 text-2xl sm:text-3xl md:text-4xl font-bold text-center sm:text-left">
            Frequently Asked Question
          </h2>
          
          <div className="space-y-4 mt-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <FaqItem
                  number={index + 1}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === index}
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dark Support Banner */}
        <div className="bg-black rounded-[2rem] md:rounded-[2.5rem] p-8 sm:p-10 md:p-14 text-white space-y-6 md:space-y-8 shadow-2xl overflow-hidden relative">
          <div className="space-y-2 md:space-y-3 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
              Couldn't find what you needed?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base md:text-lg font-medium">
              Submit a support ticket and we'll get back to you within 24 hours.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <button className="w-full sm:w-auto bg-white text-black font-bold h-12 sm:h-14 px-8 rounded-xl sm:rounded-2xl hover:bg-slate-100 transition-all text-base sm:text-lg">
              Contact Support
            </button>
            <button className="w-full sm:w-auto bg-white text-black font-bold h-12 sm:h-14 px-8 rounded-xl sm:rounded-2xl hover:bg-slate-100 transition-all text-base sm:text-lg">
              Live Chat
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFaq;
