import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
const LandingFaq = () => {
  const navigate = useNavigate();

  const questions = [
    {
      id: "item-1",
      question: "How to convert OST to PST without using Outlook?",
      answer:
        "The process is simple with our tool. Upload your .ost file using the box above. The cloud engine processes the file online, with no need for Outlook installed. Once complete, download the PST file and import it into Outlook on any PC.",
    },
    {
      id: "item-2",
      question: "Is osttopst.us a free OST to PST converter tool?",
      answer:
        "Yes, osttopst.us is free for standard file sizes. There are no extra costs, registration, or watermarks. Upgraded plans are available for priority processing and larger files, but the free service remains simple and accessible.",
    },
    {
      id: "item-3",
      question: "Who uses the OST to PST Converter?",
      answer:
        "The tool named OST to PST converter is applied by IT administrators, businesses, and individual users of Microsoft Outlook for those who are required to access or recover emails from the OST files. This tool is useful when the Outlook profile gets deleted, and the file becomes inaccessible.",
    },
    {
      id: "item-4",
      question: "How to import .ost files in Outlook?",
      answer:
        "To import an .ost file into Microsoft Outlook, you must convert it to a .PST file. As Outlook does not permit directly importing of the OST files. After the conversion is completed, open Outlook, visit the file, open and export it, then open the data file. After this, choose the PST file to access the emails.",
    },
    {
      id: "item-5",
      question: "Is my OST file data secure while converting?",
      answer:
        "Yes, all file data transfers are secured with TLS 1.3 SSL encryption. The uploaded OST files and convertible PST files are automatically and permanently deleted from the servers within the duration of 2 hours of conversion. Also, we do not access, analyze, or share your email data, so that your data remains secure.",
    },
    {
      id: "item-6",
      question: "Can I convert a damaged or orphaned OST file to PST?",
      answer:
        "Yes. Our osttopst.us conversion engine has expert-grade repair algorithms for damaged OST files. It spontaneously repairs some common types of OST file damage, such as header corruption due to sudden shutdowns, folder table damage, and sync issues. Even partially damaged OST files can be successfully recovered and converted into PST files.",
    },
    {
      id: "item-7",
      question: "What is the maximum OST file size that can be converted?",
      answer:
        "The free OST PST converter manages files up to 50 GB. For enterprise mailboxes, if your file is larger than 50 GB, then our Premium plans help with larger files with priority cloud processing queues.",
    },
    {
      id: "item-8",
      question: "Will the converted PST file work with my version of Outlook?",
      answer:
        "Yes, absolutely, our free OST to PST file converter generates a Unicode-format PST compatible with Outlook 2007, 2010, 2013, 2016, 2019, 2021, and Microsoft 365. Also, the ANSI-format output for legacy Outlook 97-2003 is also accessible on request of the users.",
    },
    // {
    //   id: "item-9",
    //   question: "What is the difference between our free OST to PST converter and premium plans?",
    //   answer: "Our free tool, ottopst.us, which is an OST to PST conversion tool, covers the main use case, such as converting OST files up to 50 GB with full data preservation. Premium plans add features like batch conversion of various OST files, priority processing queues, extended file size limits, full support, and upgraded split-PST output alternatives for large mailboxes."
    // }
  ];

  return (
    <div className="font-sans flex flex-col py-10 md:py-16">
      {/* Header Section */}
      <div className="pb-8 md:pb-12 px-4 text-center relative overflow-hidden">
        {/* Background Blobs matching Faq.jsx */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Frequently Asked <span className="text-brand-600">Questions</span>
        </h1>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 w-full flex-1 pb-10 md:pb-16">
        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-16 gap-y-10 md:gap-y-16">
          {questions.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col space-y-3"
            >
              <div className="absolute -left-6 top-1 w-1 h-0 bg-brand-500 transition-all duration-500 group-hover:h-full opacity-50 overflow-hidden rounded-full"></div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900 tracking-tight leading-snug group-hover:text-brand-700 transition-colors">
                {item.question}
              </h3>
              <p className="text-slate-600 text-sm md:text-base lg:text-lg leading-relaxed font-medium opacity-90">
                {item.answer}
              </p>
              <div className="pt-1">
                <div className="h-px w-20 bg-brand-100 group-hover:w-full transition-all duration-700"></div>
              </div>
            </div>
          ))}
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
