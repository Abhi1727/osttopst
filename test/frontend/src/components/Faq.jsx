import React, { useState } from "react";
import {
  Search,
  Mail,
  MessageSquare,
  Ticket,
  ArrowRight,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      id: "item-1",
      category: "General",
      question: "What is an OST file?",
      answer:
        "An OST file (Offline Outlook Data File) is a synchronized mirror or a 'cache' of what’s currently on the mail server. It allows you to work offline and syncs changes once you're back online.",
    },
    {
      id: "item-2",
      category: "General",
      question: "What is a PST file?",
      answer:
        "A PST file (Personal Storage Table) acts like a personal filing cabinet for emails, calendar events, and contacts. It is stored on your hard drive and is independent of the server.",
    },
    {
      id: "item-3",
      category: "General",
      question: "How do I Import an OST File into Outlook PST?",
      answer:
        "Outlook doesn't directly import OST files. You must first convert the OST to a PST format. Once converted, you can use Outlook's 'Import/Export' wizard to bring the PST data into your profile.",
    },
    {
      id: "item-4",
      category: "General",
      question: "How to convert OST to PST online?",
      answer:
        "You can use our secure online service. Simply upload your OST file, our cloud-based engine will process it instantly maintaining your folder structure, and then you can download the resulting PST file.",
    },
    {
      id: "item-5",
      category: "Technical",
      question: "How to move mails from OST to PST in Outlook 2016?",
      answer:
        "In Outlook 2016, if the account is active, you can export to a PST file via File > Open & Export > Import/Export. If the account is inaccessible, you'll need a conversion tool like ours to extract the data from the OST file.",
    },
    {
      id: "item-6",
      category: "Technical",
      question: "Does scanpst work on OST files?",
      answer:
        "The Inbox Repair Tool (scanpst.exe) is primarily designed for PST files. While it may run on OST files, it often fails to resolve complex sync issues or 'orphaned' file problems, where a dedicated converter is more effective.",
    },
    {
      id: "item-7",
      category: "Technical",
      question: "How do I change the OST File in Outlook?",
      answer:
        "You can change the location or recreate an OST file by going to Account Settings > Data Files. However, Outlook will always create a new OST file that syncs with the server; it won't 'open' an old one like a PST.",
    },
    {
      id: "item-8",
      category: "General",
      question: "What is migrate emails OST to PST converter tool?",
      answer:
        "It is a specialized utility designed to unlock 'orphaned' or inaccessible OST files and convert them into standard PST files that can be opened by any Outlook version.",
    },
    {
      id: "item-9",
      category: "Technical",
      question: "How to convert emails to PST files?",
      answer:
        "Emails can be saved to PST files by using the Export function in Outlook or by using a conversion service like ours to transform an existing OST cache into a standalone PST file.",
    },
    {
      id: "item-10",
      category: "General",
      question: "How to open an OST File without Outlook?",
      answer:
        "OST files are locked to the MAPI profile that created them. To view the data without the original Outlook account, you must convert it to a PST or use an OST viewer tool.",
    },
    {
      id: "item-11",
      category: "Technical",
      question: "How to create .PST file without using Outlook?",
      answer:
        "Professional conversion services like ours can generate valid PST files directly from your OST data using server-side processing, eliminating the need for a local Outlook installation during the process.",
    },
    {
      id: "item-12",
      category: "Technical",
      question: "How to merge OST and PST files?",
      answer:
        "The best way is to convert the OST to a PST first. Once you have two PST files, you can use Outlook's import feature or our service to consolidate the data into a single, searchable file.",
    },
    {
      id: "item-13",
      category: "General",
      question: "Is the OST TO PST converter safe?",
      answer:
        "Our online viewer and converter use 256-bit SSL encryption. Unlike many 'free' downloadable tools that may harbor malware, our cloud-based process ensures your data remains in a secure pipeline.",
    },
    {
      id: "item-14",
      category: "Technical",
      question: "Will a large PST file slow down Outlook?",
      answer:
        "Yes, very large PST files (especially over 20-30GB) can cause performance lag. Our service offers deduplication during conversion to help keep your final PST file as lean and efficient as possible.",
    },
    {
      id: "item-15",
      category: "General",
      question: "Does the new Outlook still use OST files?",
      answer:
        "Yes, the modern 'New Outlook' for Windows and Office 365 continues to use a local cache for offline access and performance, which is stored in a format similar to the traditional OST.",
    },
    {
      id: "item-16",
      category: "Technical",
      question: "What is the limitation of OST file in Outlook?",
      answer:
        "The biggest limitation is portability; an OST cannot be opened on another computer or by a different user profile without being converted to PST first.",
    },
    {
      id: "item-17",
      category: "Technical",
      question: "Can you read an OST file?",
      answer:
        "Not directly like a document. It requires the original mail profile or a conversion tool to 'read' and extract the data into a usable format like PST.",
    },
    {
      id: "bill-1",
      category: "Billing",
      question: "Will I get an official invoice for my purchase?",
      answer:
        "Yes, an official PDF invoice is automatically generated and sent to your registered email address immediately after the transaction is completed. You can also request custom billing details to be added to the invoice.",
    },
    {
      id: "bill-2",
      category: "Billing",
      question: "Is it a one-time fee or a recurring subscription?",
      answer:
        "Our licenses are strictly one-time payments. There are no monthly or yearly recurring fees. Once you purchase a license, you own it for a lifetime for that specific version.",
    },
    {
      id: "bill-3",
      category: "Billing",
      question: "What is your refund policy?",
      answer:
        "We offer a 30-day money-back guarantee. If our software fails to perform the conversion as promised and our technical team cannot resolve the issue, we will process a full refund without any questions.",
    },
    {
      id: "bill-4",
      category: "Billing",
      question: "Can I use one license on multiple computers?",
      answer:
        "The Personal license is valid for a single PC. The Corporate and Technical licenses allow for multiple installations (10 and Unlimited respectively) within the same organization.",
    },
  ];

  const filteredQuestions = questions.filter(
    (q) =>
      q.category === activeCategory ||
      (activeCategory === "General" && q.category === "General"), // Default logic
  );

  // Group questions by 'General' and 'Technical' for the specific layout in screenshot
  // The screenshot shows "General Questions" and "Technical Support" sections.
  // We can render all sections or filter. The screenshot implies a long scrolling list or sections.
  // Let's implement it as sections for better UX matching the visual of having headers.

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col">
      {/* Header Section */}
      <div className="bg-slate-50 pt-20 pb-16 px-4 text-center relative overflow-hidden">
        {/* Background Blobs matching screenshot style roughly */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
          Frequently Asked <span className="text-emerald-600">Questions</span>
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base mb-10">
          Everything you need to know about the OST to PST conversion process,
          security, and licensing.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <div className="relative flex items-center shadow-lg shadow-slate-200/50 rounded-full bg-white">
            <Search className="absolute left-6 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for questions..."
              className="w-full pl-14 pr-32 py-4 rounded-full border-none focus:ring-0 text-slate-700 bg-transparent outline-none h-14"
            />
            <Button className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 font-semibold h-auto">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 w-full flex-1 pb-32">
        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-20">
          {["General", "Technical", "Billing"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 border ${
                activeCategory === cat
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200 scale-105"
                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
              }`}
            >
              {cat} Questions
            </button>
          ))}
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-16 gap-y-16">
          {questions
            .filter((q) => q.category.includes(activeCategory))
            .map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col space-y-4"
              >
                <div className="absolute -left-6 top-1 w-1 h-0 bg-emerald-500 transition-all duration-500 group-hover:h-full opacity-50 overflow-hidden rounded-full"></div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug group-hover:text-emerald-700 transition-colors">
                  {item.question}
                </h3>
                <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium opacity-90">
                  {item.answer}
                </p>
                <div className="pt-2">
                  <div className="h-px w-20 bg-emerald-100 group-hover:w-full transition-all duration-700"></div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Footer Banner */}
      <div className="max-w-6xl mx-auto px-4 w-full mb-20">
        <div className="bg-emerald-700 rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-emerald-900/10">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

          <div className="relative z-10 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
              Couldn't find what you needed?
            </h2>
            <p className="text-emerald-100 text-sm md:text-base max-w-lg">
              Submit a support ticket and we'll get back to you within 24 hours.
            </p>
          </div>

          <div className="relative z-10 flex gap-4">
            <Button
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold h-12 px-6 rounded-lg shadow-lg"
              onClick={() => navigate("/support")}
            >
              Contact Support
            </Button>
            <Button
              variant="outline"
              className="bg-emerald-800/50 text-white border-emerald-600 hover:bg-emerald-800 hover:text-white font-bold h-12 px-6 rounded-lg"
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

export default Faq;
