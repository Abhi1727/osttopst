import React from "react";
import { Button } from "@/components/ui/button";
import Download from "lucide-react/dist/esm/icons/download";
import ShoppingCart from "lucide-react/dist/esm/icons/shopping-cart";
import Shield from "lucide-react/dist/esm/icons/shield";
import Clock from "lucide-react/dist/esm/icons/clock";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Wrench from "lucide-react/dist/esm/icons/wrench";
import History from "lucide-react/dist/esm/icons/history";
import Layers from "lucide-react/dist/esm/icons/layers";
import Zap from "lucide-react/dist/esm/icons/zap";
import Lock from "lucide-react/dist/esm/icons/lock";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import ArrowLeftRight from "lucide-react/dist/esm/icons/arrow-left-right";
import Eye from "lucide-react/dist/esm/icons/eye";
import CloudOff from "lucide-react/dist/esm/icons/cloud-off";
import Scissors from "lucide-react/dist/esm/icons/scissors";
import Type from "lucide-react/dist/esm/icons/type";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Filter from "lucide-react/dist/esm/icons/filter";
import Paperclip from "lucide-react/dist/esm/icons/paperclip";
import Folder from "lucide-react/dist/esm/icons/folder";
import Contact from "lucide-react/dist/esm/icons/contact";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import StickyNote from "lucide-react/dist/esm/icons/sticky-note";
import MailIcon from "lucide-react/dist/esm/icons/mail";
import ShieldOff from "lucide-react/dist/esm/icons/shield-off";
import Link2Off from "lucide-react/dist/esm/icons/link-2-off";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import UserMinus from "lucide-react/dist/esm/icons/user-minus";
import Server from "lucide-react/dist/esm/icons/server";
import HeartCrack from "lucide-react/dist/esm/icons/heart-crack";
import Settings from "lucide-react/dist/esm/icons/settings";
import Quote from "lucide-react/dist/esm/icons/quote";
import { useState } from "react";

const OstToPstDesktop = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      n: 1,
      t: "Download & Install Converter",
      subtitle: "Download our OST to PST software converter tool and install it.",
      items: [
        "Go to the OST to PST Converter download page.",
        "Click the download button to get the installer.",
        "Complete the installation by following the prompts.",
        "Open the converter once installation is finished.",
      ],
    },
    {
      n: 2,
      t: "Add OST File",
      subtitle:
        "Click on Add File or select the OST File that you want to convert.",
      items: [
        "Click “Add File” or locate the preferred OST file.",
        "Select File and click Open to continue.",
        "Choose the required file and click Open to proceed.",
        "The file gets uploaded and prepared for scanning and conversion.",
      ],
    },
    {
      n: 3,
      t: "Check OST File",
      subtitle:
        "Before converting the OST File, ensure that the chosen OST file is correct.",
      items: [
        "Verify the selected OST file is accurate",
        "Check the file name and location",
        "Ensure that the OST File contains Mailbox Data",
      ],
    },
    {
      n: 4,
      t: "Select Format",
      subtitle:
        "Choose the PST format to convert the OST File to a PST file. You can choose to convert the OST file into several other formats.",
      items: [
        "Select PST as the required format.",
        "Choose other file formats.",
        "Click the selected format.",
      ],
    },
    {
      n: 5,
      t: "Start Conversion",
      subtitle:
        "Select the Target path you want the PST file to be stored in and click on the Export button to start the conversion process.",
      items: [
        "Choose the file path where you want to save the PST file.",
        "Click Export to convert the OST into PST.",
        "View the real-time progress of the conversion process and the saved file.",
      ],
    },
    {
      n: 6,
      t: "Data Verification",
      subtitle:
        "Once the process is completed, the PST File is ready to download. Check if all the data is accurately transferred to the PST file.",
      items: [
        "Confirm Export Completion to ensure the conversion process has finished.",
        "Verify emails, contacts, calendars, and attachments are transferred correctly.",
      ],
    },
  ];

  return (
    <div className="bg-white min-h-screen pt-12">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-16 items-center">
          <div className="mb-12 lg:mb-0 text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Secure OST to PST <br />
              Conversion with <br />
              <span className="text-brand-500">Enterprise Precision</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl font-medium">
              Reliably migrate orphaned, corrupted, or encrypted OST files to
              accessible Outlook PST format. Experience zero data loss and
              absolute technical accuracy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                size="lg"
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 h-14 rounded-none gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95 text-lg"
              >
                <Download className="w-5 h-5" />
                Download Free Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700 hover:text-brand-600 font-bold px-8 h-14 rounded-none gap-2 transition-all text-lg"
              >
                <ShoppingCart className="w-5 h-5" />
                Buy Now
              </Button>
            </div>

            {/* Stats */}
            <div className="pt-10 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <p className="text-3xl font-bold text-brand-600 mb-1">
                  10+ Years
                </p>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                  Industry Experience
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-brand-600 mb-1">24x7</p>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                  Technical Support
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-brand-600 mb-1">99.9%</p>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                  Conversion Accuracy
                </p>
              </div>
            </div>
          </div>

          <div className="relative group">
            {/* Main App Image */}
            <div className="relative z-10 bg-[#1a1a1a] rounded-none p-2 shadow-2xl overflow-hidden border border-slate-800 transition-transform duration-500 group-hover:scale-[1.02]">
              <div className="aspect-[16/10] bg-slate-900 rounded-none overflow-hidden">
                <img
                  src="/ost-pst-desktop.png"
                  alt="OST to PST Desktop Application Dashboard"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>

            {/* Floating elements for visual interest */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-200 rounded-full blur-[100px] opacity-30 -z-0"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-200 rounded-full blur-[100px] opacity-30 -z-0"></div>

            {/* Feature floating cards */}
            <div className="absolute top-1/4 -right-8 z-20 bg-white p-4 rounded-none shadow-xl border border-slate-100 hidden xl:block animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-none">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Security
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    AES-256 Encrypted
                  </p>
                </div>
              </div>
            </div>

            <div
              className="absolute bottom-1/4 -left-8 z-20 bg-white p-4 rounded-none shadow-xl border border-slate-100 hidden xl:block animate-bounce-slow"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-brand-100 p-2 rounded-none">
                  <Shield className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Integrity
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    Zero Data Loss
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Product Highlights Section */}
      <section className="py-24 bg-[#f4f7ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-[#1e293b] mb-2">
              Key Product Highlights
            </h2>
            <p className="text-[#64748b] text-sm font-medium">
              Engineered for comprehensive data recovery and seamless mailbox
              migration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <HighlightCard
              icon={RefreshCw}
              text="Seamless conversion of OST to Outlook PST"
            />
            <HighlightCard
              isLogo={true}
              text="Handles large OST files with zero lag"
            />
            <HighlightCard
              icon={Wrench}
              text="Advanced support for corrupted OST files"
            />
            <HighlightCard
              icon={History}
              text="Supports all MS Outlook versions (2000-2021)"
            />
            <HighlightCard
              icon={Layers}
              text="Built-in de-duplication engine"
            />
            <HighlightCard
              icon={ShieldCheck}
              text="Preserves Folder Hierarchy & Metadata"
            />
            <HighlightCard
              icon={ShieldCheck}
              text="100% Secure & Data-Integrity Guaranteed"
            />
            <HighlightCard
              icon={Zap}
              text="High-speed multi-threaded conversion"
            />
            <HighlightCard
              icon={Lock}
              text="Support for password-protected OST"
            />
          </div>
        </div>
      </section>

      {/* Enterprise-Grade Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-[#1e293b] mb-16">
            Enterprise-Grade Features
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            <EnterpriseFeatureCard
              icon={ArrowLeftRight}
              title="Multi-Format Export"
              description="Convert OST not just to PST, but to EML, MSG, PDF, and HTML formats effortlessly."
            />
            <EnterpriseFeatureCard
              icon={Eye}
              title="Detailed Preview"
              description="Full preview of all email components, attachments, and metadata before final export."
            />
            <EnterpriseFeatureCard
              icon={CloudOff}
              title="No Server Needed"
              description="Standalone utility. No Outlook or Exchange Server connection required for conversion."
            />
            <EnterpriseFeatureCard
              icon={Scissors}
              title="Split PST Option"
              description="Prevent PST corruption by splitting large files into smaller, manageable sizes."
            />
            <EnterpriseFeatureCard
              icon={Type}
              title="Naming Convention"
              description="Organize exported emails with custom naming rules based on date, subject, or sender."
            />
            <EnterpriseFeatureCard
              icon={Layers}
              title="Batch Conversion"
              description="Process hundreds of OST files in a single queue with enterprise batch processing."
            />
            <EnterpriseFeatureCard
              icon={Monitor}
              title="Modern Interface"
              description="Clean, intuitive UI designed for both IT professionals and home users."
            />
            <EnterpriseFeatureCard
              icon={Filter}
              title="Selective Filter"
              description="Export specific folders or date ranges to keep your new PST clean and relevant."
            />
          </div>
        </div>
      </section>

      {/* Supported Export Formats Section */}
      <section className="py-20 bg-brand-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-white">Supported Export Formats</h2>
            <div className="flex flex-wrap justify-center gap-3 ">
                {['PST', 'EML', 'MSG', 'HTML', 'MBOX', 'PDF', 'DOC', 'JSON', 'TXT','DOCX','CSV','XML','VCF','ICS','OLM'].map((format) => (
                    <div key={format} className="px-5 py-2 bg-white border border-white text-brand-500 text-xs font-bold tracking-widest rounded-md">
                        {format}
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Comprehensive Data Recovery Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Comprehensive Data Recovery</h2>
                <p className="text-slate-500 font-medium">Every granular mailbox item is recovered with original formatting.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                <RecoveryCategory 
                    icon={MailIcon} 
                    title="Email" 
                    items={["Email Body & Threads", "CC / BCC Fields", "From / To / Date", "Subject Line", "Digital Signatures"]} 
                />
                <RecoveryCategory 
                    icon={Paperclip} 
                    title="Attachments" 
                    items={["Documents (PDF, Office)", "Images (JPG, PNG, TIFF)", "Multimedia Files", "Archive Files (ZIP, RAR)"]} 
                />
                <RecoveryCategory 
                    icon={Folder} 
                    title="Folders" 
                    items={["Inbox & Sent Items", "Drafts & Deleted Items", "Custom User Folders", "Junk & Archive Mail"]} 
                />
                <RecoveryCategory 
                    icon={Contact} 
                    title="Contacts" 
                    items={["Full Names & Titles", "Primary & Secondary Emails", "Phone Numbers & Addresses", "Company Metadata"]} 
                />
                <RecoveryCategory 
                    icon={Calendar} 
                    title="Calendar" 
                    items={["Meeting Invites", "Appointments", "Recurring Events", "Location & Attachments"]} 
                />
                <RecoveryCategory 
                    icon={StickyNote} 
                    title="Notes & Tasks" 
                    items={["Personalized Notes", "Tasks & Deadlines", "Priority Status", "Start/End Date Metadata"]} 
                />
            </div>
        </div>
      </section>

      {/* How it Works - Accordion Section */}
      <section className="py-24 bg-[#f1f7ff]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              How does our OST to PST Converter work?
            </h2>
            <p className="text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Our OST to PST Converter works by scanning your OST file safely,
              and also allows you to preview the mailbox data before the
              conversion:
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.n}
                className={`bg-white border transition-all duration-300 rounded-none overflow-hidden ${
                  activeStep === index
                    ? "border-brand-500 shadow-xl shadow-brand-500/5"
                    : "border-slate-100 shadow-sm"
                }`}
              >
                <button
                  onClick={() => setActiveStep(activeStep === index ? -1 : index)}
                  className="w-full flex items-center gap-6 p-6 text-left hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-none transition-colors ${
                      activeStep === index ? "bg-brand-500" : "bg-slate-100"
                    }`}
                  >
                    <span
                      className={`font-bold text-lg ${
                        activeStep === index ? "text-white" : "text-slate-500"
                      }`}
                    >
                      {step.n}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-base font-bold text-slate-900">
                      {step.t}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                      activeStep === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${
                    activeStep === index ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-8 ml-16 border-t border-slate-50 pt-6">
                    <p className="text-sm text-slate-900 font-bold mb-4">
                      {step.subtitle}
                    </p>
                    <ul className="space-y-3">
                      {step.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-slate-500 font-medium"
                        >
                          <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Reliability Pillars Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900">Security & Reliability Pillars</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SecurityPillarCard 
                    icon={ShieldCheck} 
                    title="Handle Data Safely" 
                    description="Local processing only. Your emails never leave your machine during the conversion process." 
                />
                <SecurityPillarCard 
                    icon={ShieldOff} 
                    title="Zero Data Loss" 
                    description="Advanced recovery algorithms ensure even corrupted segments are reconstructed without loss." 
                />
                <SecurityPillarCard 
                    icon={Link2Off} 
                    title="Orphaned OST Recovery" 
                    description="Full recovery for OST files that are no longer associated with their original Exchange account." 
                />
                <SecurityPillarCard 
                    icon={Lock} 
                    title="TLS 1.3 Encryption" 
                    description="Enterprise-grade encryption standards applied to all software communications and updates." 
                />
            </div>
        </div>
      </section>

      {/* Common Use Scenarios Section */}
      <section className="py-24 bg-brand-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-16 text-white">Common Use Scenarios</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                <ScenarioCard 
                    icon={UserMinus} 
                    title="Profile Removed" 
                    description="When an Outlook profile is deleted and the OST becomes inaccessible." 
                />
                <ScenarioCard 
                    icon={Server} 
                    title="Server Crash" 
                    description="Retrieving local data after an Exchange server failure or decommissioning." 
                />
                <ScenarioCard 
                    icon={HeartCrack} 
                    title="Corrupted OST" 
                    description="Fixing 'The file is not an Outlook data file' errors through reconstruction." 
                />
                <ScenarioCard 
                    icon={Settings} 
                    title="Switching Systems" 
                    description="Migrating legacy OST data to a new Windows machine or Outlook version." 
                />
            </div>
        </div>
      </section>

      {/* Trusted by IT Experts Section */}
      <section className="py-24 bg-white border-b border-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900">Trusted by IT Experts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <TestimonialCard 
                    quote="Recovered 15GB of orphaned OST data in minutes. Absolute lifesaver." 
                    author="Akash R." 
                    role="SysAdmin" 
                />
                <TestimonialCard 
                    quote="The preview feature is incredible. I only exported the folders I needed." 
                    author="Brinley S." 
                    role="Corporate IT" 
                />
                <TestimonialCard 
                    quote="Fast, clean, and didn't crash once on a corrupted 50GB file." 
                    author="Ava J." 
                    role="Software Consultant" 
                />
                <TestimonialCard 
                    quote="Highly recommend for enterprise migrations. The batch tool is seamless." 
                    author="Liam M." 
                    role="Network Lead" 
                />
                <TestimonialCard 
                    quote="Technical support helped me through a tricky encrypted OST scenario instantly." 
                    author="Chloe W." 
                    role="Data Specialist" 
                />
                <TestimonialCard 
                    quote="The cleanest UI I've seen in a utility tool. No fluff, just performance." 
                    author="Ethan K." 
                    role="Tech Support Pro" 
                />
            </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#f8fbff]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-3">
            {[
              { q: "Can I convert corrupted OST files?", a: "Yes, our advanced scanning engine is designed to reconstruct data from severely corrupted OST files and export them to healthy PST format." },
              { q: "Is MS Outlook required for the conversion?", a: "No, the software works independently. You do not need MS Outlook installed to perform the OST to PST conversion." },
              { q: "What is the file size limit for conversion?", a: "There is no file size limit. Our tool can easily handle large OST files, including those exceeding 50GB or 100GB." },
              { q: "Will it maintain the folder hierarchy?", a: "Absolutely. The software ensures that the original folder structure (Inbox, Sent Items, Drafts, etc.) is perfectly preserved in the converted file." },
              { q: "Does it support encrypted OST files?", a: "Yes, it can decrypt and convert password-protected or encrypted OST files without requiring the original password." },
              { q: "Can I export to formats other than PST?", a: "Yes, besides PST, you can export to EML, MSG, RTF, HTML, PDF, MBOX, and several other formats." },
              { q: "Is the free demo limited?", a: "The free demo allows you to scan and preview all mailbox items. To save the converted data, a license key is required." },
              { q: "Which versions of Windows are supported?", a: "The software is compatible with all modern Windows versions, including Windows 11, 10, 8.1, 8, and 7." },
              { q: "Is batch conversion possible?", a: "Yes, the technician and enterprise editions support batch conversion, allowing you to process multiple OST files simultaneously." },
              { q: "How can I get technical support?", a: "We provide 24/7 technical support via email and live chat to help you with any conversion queries or issues." }
            ].map((faq, idx) => (
              <FaqItem key={idx} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-none p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-500/20 to-transparent opacity-50"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Migrate Your Data?
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
              Download the trial version now and preview your converted PST data
              for free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-10 h-16 rounded-none gap-2 text-xl transition-all active:scale-95 shadow-xl shadow-brand-500/25"
              >
                <Download className="w-6 h-6" />
                Download Now
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
const EnterpriseFeatureCard = ({ icon: Icon, title, description }) => {
  const isModern = title === "Modern Interface";
  return (
    <div className="text-left group p-8 border border-slate-100 hover:border-brand-200 transition-all h-full bg-white">
      <div className={`w-12 h-12 flex items-center justify-center mb-6 transition-colors rounded-none ${
        isModern ? "bg-brand-500" : "bg-white group-hover:bg-brand-500"
      }`}>
        <Icon className={`w-5 h-5 transition-colors ${
          isModern ? "text-white" : "text-brand-500 group-hover:text-white"
        }`} />
      </div>
      <h3 className="text-lg font-bold text-[#1e293b] mb-3">{title}</h3>
      <p className="text-[#64748b] text-sm leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
};

const HighlightCard = ({ icon: Icon, text, isLogo }) => (
  <div className="bg-white p-6 border border-[#e2e8f0] rounded-none flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow h-28">
    <div className="flex-shrink-0">
      {isLogo ? (
        <div className="flex items-center gap-1">
          <span className="text-brand-500 font-black italic tracking-tighter text-xl">
            BIGTOP
          </span>
          <div className="w-4 h-4 bg-brand-500 flex items-center justify-center rounded-none">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        </div>
      ) : (
        <Icon className="w-6 h-6 text-brand-500" />
      )}
    </div>
    <p className="text-[#334155] font-bold text-sm leading-snug">{text}</p>
  </div>
);

const RecoveryCategory = ({ icon: Icon, title, items }) => (
    <div className="text-left">
        <div className="flex items-center gap-3 mb-4">
            <Icon className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
        </div>
        <div className="w-full h-[2px] bg-brand-100 mb-6 relative">
            <div className="absolute left-0 top-0 w-1/4 h-full bg-brand-500"></div>
        </div>
        <ul className="space-y-3">
            {items.map((item) => (
                <li key={item} className="text-sm text-slate-500 font-medium leading-tight">{item}</li>
            ))}
        </ul>
    </div>
);

const SecurityPillarCard = ({ icon: Icon, title, description }) => (
    <div className="bg-[#f8faff] p-8 rounded-none border border-blue-50/50 flex items-start gap-6 transition-all hover:bg-blue-50">
        <div className="flex-shrink-0 mt-1">
            <Icon className="w-6 h-6 text-brand-500" />
        </div>
        <div>
            <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{description}</p>
        </div>
    </div>
);

const ScenarioCard = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col items-center group">
        <div className="mb-6 p-4 rounded-none transition-transform group-hover:scale-110">
            <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
        <p className="text-white/80 text-sm leading-relaxed max-w-[240px] mx-auto">
            {description}
        </p>
    </div>
);

const TestimonialCard = ({ quote, author, role }) => (
    <div className="bg-white p-8 border border-slate-100 rounded-none relative transition-all hover:border-brand-200">
        <Quote className="w-6 h-6 text-brand-500 mb-6" />
        <p className="text-slate-600 italic font-medium text-sm mb-8 leading-relaxed">
            "{quote}"
        </p>
        <div>
            <p className="text-slate-900 font-bold text-sm">{author}</p>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{role}</p>
        </div>
    </div>
);

const FaqItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-white border border-slate-200 rounded-none overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
                <span className="text-sm font-bold text-slate-800">{question}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pb-4 text-xs text-slate-500 font-medium leading-relaxed">
                    {answer}
                </div>
            </div>
        </div>
    );
};

export default OstToPstDesktop;
