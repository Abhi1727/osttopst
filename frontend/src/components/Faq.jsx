import React, { useState } from "react";
import {
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Faq = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("General");

  const categories = [
    { id: "General", label: "General", icon: "Info" },
    { id: "Technical", label: "Technical", icon: "Settings" },
    { id: "Billing", label: "Billing & Licensing", icon: "CreditCard" },
  ];

  const questions = [
    {
      id: "gen-1",
      category: "General",
      question: "What is OST file in Outlook?",
      answer:
        "An OST file, which stands for Offline Outlook Data File, is a setup mirror or a 'cache' of what’s currently on the mail server. It permits you to work offline and syncs modifications once you're back online.",
    },
    {
      id: "gen-2",
      category: "General",
      question: "What is a PST file?",
      answer:
        "A PST file, which stands for Personal Storage Table, acts like a personal filing cabinet for emails, calendar events, and contacts. It is gathered on a hard drive and is free of the server.",
    },
    {
      id: "gen-3",
      category: "General",
      question: "How do I Import an OST File into Outlook PST?",
      answer:
        "Outlook doesn't directly import OST files. First, you must convert the OST to a PST format. Once it gets converted, you can utilize Outlook's 'Import/Export' wizard to bring out the PST data into your profile.",
    },
    {
      id: "gen-4",
      category: "General",
      question: "How to convert OST to PST online?",
      answer:
        "You can utilize our safe and secure online service. Just simply add your OST file, our cloud-based engine will process it quickly, managing your folder structure, and then you can download or install the PST file.",
    },
    {
      id: "gen-5",
      category: "General",
      question: "What is the migrate emails OST to PST converter tool?",
      answer:
        "It is a characterized utility built to unlock 'orphaned' OST files and convert them into standard PST files that can be opened by any Outlook version.",
    },
    {
      id: "gen-6",
      category: "General",
      question: "How to open an OST File without Outlook?",
      answer:
        "OST files are locked to the MAPI profile that generated them. To see the data without the original Outlook account, you must convert it to a PST or utilize an OST viewer tool.",
    },
    {
      id: "gen-7",
      category: "General",
      question: "Is the OST TO PST converter safe?",
      answer:
        "Our online viewer and converter use 256-bit SSL encryption. Unlike many 'free' downloadable tools that may harbor malware, our cloud-based process makes sure your data stays in a safe and secure pipeline.",
    },
    {
      id: "gen-8",
      category: "General",
      question: "Does the new Outlook still use OST files?",
      answer:
        "Yes, the contemporary 'New Outlook' for Windows and Office 365 continues to utilize a local cache for offline access and performance, which is stored in a format similar to the outdated OST.",
    },
    {
      id: "tech-1",
      category: "Technical",
      question: "How to move mails from OST to PST in Outlook 2016?",
      answer:
        "In Outlook 2016, if the account is active, you can export to a PST file through File > Open & Export > Import/Export. If the account is inaccessible, you'll need a conversion tool like ours to extract the data from the OST file.",
    },
    {
      id: "tech-2",
      category: "Technical",
      question: "Does scanpst.exe work on OST files?",
      answer:
        " Yes, scanpst.exe works on OST files. It is provided by Microsoft Outlook to repair the corrupted and damaged OST files.",
    },
    {
      id: "tech-3",
      category: "Technical",
      question: "How do I change the OST File in Outlook?",
      answer:
        "You can modify the location or recreate an OST file by going to Account Settings > Data Files. However, Outlook will always create a new OST file that syncs with the server; it won't 'open' an old one like a PST.",
    },
    {
      id: "tech-4",
      category: "Technical",
      question: "How can I convert my emails to PST files?",
      answer:
        "The Emails can be saved to PST files via the Export feature in Outlook or a conversion service.",
    },
    {
      id: "tech-5",
      category: "Technical",
      question: "How can we make a PST file without using Outlook?",
      answer:
        "Professional conversion services like ours can generate valid PST files directly from your OST data using server-side processing, eliminating the need for a local Outlook installation during the process.",
    },
    {
      id: "tech-6",
      category: "Technical",
      question: "How can I combine OST and PST files?",
      answer:
        " Having two PST files, you can utilize Outlook's import feature to integrate the data into one file. ",
    },
    {
      id: "tech-7",
      category: "Technical",
      question: "Will a big-sized PST file slow down Outlook?",
      answer:
        "Yes, our service provides deduplication during conversion to keep your ultimate PST file as efficient as possible.",
    },
    {
      id: "tech-8",
      category: "Technical",
      question: "What is the disadvantage of the OST file in Outlook?",
      answer:
        "The disadvantage is adaptability; an OST file is not able to open on another PC without being converted to a PST file.",
    },
    {
      id: "bill-1",
      category: "Billing",
      question: "Will I receive an invoice for my purchase?",
      answer:
        " Yes, an official PDF invoice is created automatically and sent to your registered email address spontaneously after the transaction is completed. You can even request billing details to be included in the invoice.",
    },
    {
      id: "bill-2",
      category: "Billing",
      question: "Is it a one-time fee subscription?",
      answer:
        "Our licenses are one-time payments. There are no monthly or yearly fees. If you buy a license, you have it for a lifetime.",
    },
    {
      id: "bill-3",
      category: "Billing",
      question: "What is our refund policy?",
      answer:
        "We provide a 30-day money-back policy. If our software fails to perform the conversion, and our technical team is not able to resolve the problem.",
    },
    {
      id: "bill-4",
      category: "Billing",
      question: "Can we use one license on multiple desktops?",
      answer:
        " The Personal license is suitable for a single PC. The Corporate and Technical licenses allow numerous downloads within the same company.",
    },
  ];

  // const filteredQuestions = questions.filter(
  //   (q) =>
  //     q.category === activeCategory ||
  //     (activeCategory === "General" && q.category === "General"),
  // );

   return (
    <div className="bg-slate-50 min-h-screen flex flex-col">

      {/* HEADER */}
      <header className="bg-gradient-to-b from-brand-50/80 to-slate-50 pt-12 pb-10 px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-brand-600 mb-4">
          Frequently Asked Questions
        </h1>

        <p className="text-slate-500 max-w-2xl mx-auto mb-8">
          Everything you need to know about the OST to PST conversion process,
          security, and licensing.
        </p>

        {/* SEARCH */}
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-center bg-white rounded-full shadow-md">
            <Search className="absolute left-5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for questions..."
              className="w-full pl-12 pr-28 py-3 rounded-full outline-none"
            />
            <Button className="absolute right-2 bg-brand-600 text-white rounded-full px-6">
              Search
            </Button>
          </div>
        </div>
      </header>

      {/* CATEGORY TABS */}
      <div className="flex justify-center gap-4 mt-6 mb-10">
        {["General", "Technical", "Billing"].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full text-sm font-medium border transition ${
              activeCategory === cat
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-slate-600 border-slate-300 hover:text-brand-600"
            }`}
          >
            {cat} Questions
          </button>
        ))}
      </div>

        {/* SHARED CONTAINER */}
<div className="w-full px-6 md:px-12 lg:px-20 xl:px-24">

  <div className="max-w-5xl mx-auto">

    {/* FAQ CONTENT */}
    <div className="mb-16">
      {questions
        .filter((q) => q.category === activeCategory)
        .map((item, index) => (
          
          <div key={item.id} className="mb-10">

            <h3 className="text-xl md:text-2xl font-semibold text-black mb-2">
              {index + 1}. {item.question}
            </h3>

            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              {item.answer}
            </p>

          </div>
        ))}
    </div>

    {/* CTA SECTION */}
    <div className="bg-black rounded-2xl px-8 md:px-12 py-10 mb-20">
      
      <h2 className="text-white text-2xl md:text-3xl font-semibold mb-2">
        Couldn't find what you needed?
      </h2>

      <p className="text-gray-400 text-base md:text-lg mb-6">
        Submit a support ticket and we’ll get back to you within 24 hours.
      </p>

      <div className="flex gap-4">
        <Button 
          className="bg-white text-black px-6 py-2 rounded-lg font-medium"
          onClick={() => navigate("/contact-us")}
        >
          Contact Support
        </Button>

        <Button className="bg-white text-black px-6 py-2 rounded-lg font-medium">
          Live Chat
        </Button>
      </div>

    </div>

  </div>
</div>
      </div>
  );
};

export default Faq;
