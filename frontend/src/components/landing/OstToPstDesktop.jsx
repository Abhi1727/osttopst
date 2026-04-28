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
              OST to PST Converter <br />
              Software <br />
              <span className="text-brand-500">Quick & Reliable</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl font-medium">
              Quickly recover inaccessible, corrupted, or orphaned OST files and convert them into PST format without losing the data. Our upgraded OST to PST Converter ensures complete mailbox recovery while maintaining the original structure.
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
                  of experience
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-brand-600 mb-1">24x7</p>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                  Customer Support
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-brand-600 mb-1">99%</p>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                  Data Accuracy
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
              Key Highlights of our OST to PST Converter Tool
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <HighlightCard
              icon={RefreshCw}
              text="Our OST to PST Converter tool seamlessly converts OST files, including emails, contacts, calendars, tasks, notes, and much more."
            />
            <HighlightCard
              isLogo={true}
              text="We transform large OST Files into PST while maintaining complete data integrity."
            />
            <HighlightCard
              icon={Wrench}
              text="Our Service converts the corrupted OST files also into PST files safely and securely."
            />
            <HighlightCard
              icon={History}
              text="We support Office 365, and all the versions of Outlook 2021, 2019, 2016, 2013, 2010, and 2007."
            />
            <HighlightCard
              icon={Layers}
              text="We assure that your email folders and sub-folders are organized with easy navigation and quick access to the data."
            />
            <HighlightCard
              icon={ShieldCheck}
              text="We ensure that there is no duplication of data while preserving the original items with built-in protection."
            />
            <HighlightCard
              icon={ShieldCheck}
              text="Our service safeguards your OST files locally in multiple formats such as PST, MBOX, MSG, EML, and more."
            />
            <HighlightCard
              icon={Zap}
              text="After downloading our OST to PST Converter Offline tool, you will get a seamless conversion experience."
            />
            <HighlightCard
              icon={Scissors}
              text="You can split converted large PST files into smaller PST files using our OST to PST Offline Converter."
            />
            <HighlightCard
              icon={Lock}
              text="The OST Converter tool guides you to easily retrieve corrupted and deleted data from the OST file into the original file formats."
            />
          </div>
        </div>
      </section>

      {/* Enterprise-Grade Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-[#1e293b] mb-16">
            Prime Features of OST to PST Converter
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            <EnterpriseFeatureCard
              icon={ArrowLeftRight}
              title="Convert OST to PST & Other Formats"
              description="Our tool helps users convert OST files into PST files as well as into 9 other formats like EML, MSG, HTML, MBOX, EMLX, PDF, DOC, JSON, and TXT."
            />
            <EnterpriseFeatureCard
              icon={Eye}
              title="Preview Emails and Mailbox Items"
              description="Users can easily view emails, attachments, and other mailbox items of the OST file before initiating the conversion process."
            />
            <EnterpriseFeatureCard
              icon={CloudOff}
              title="No Outlook Installation Required"
              description="Our tool ensures that users don’t need to install Outlook to convert the OST file into a PST file."
            />
            <EnterpriseFeatureCard
              icon={Server}
              title="No Exchange Server Needed"
              description="Using our OST to PST Converter, you can access or download the converted PST file without the Exchange server & Microsoft Office 365."
            />
            <EnterpriseFeatureCard
              icon={Scissors}
              title="Split Large PST File"
              description="Our software offers an alternative to split the large PST file to limit the chances of a corrupted file. You can easily split a PST file by size, date, email ID, and folder."
            />
            <EnterpriseFeatureCard
              icon={Type}
              title="Naming Convention"
              description="With the help of our naming convention option, you can save the OST file to various formats. Our software offers a naming pattern as the subject."
            />
            <EnterpriseFeatureCard
              icon={Layers}
              title="Batch Conversion"
              description="Convert multiple OST files into PST in one go without damaging the accuracy and save time and effort."
            />
            <EnterpriseFeatureCard
              icon={Monitor}
              title="User-Friendly Interface"
              description="Our OST to PST Converter tool is designed to be well understood by the users. The interface is made simple and easy with clear instructions and guidance."
            />
          </div>
        </div>
      </section>

      {/* Supported Export Formats Section */}
      <section className="py-20 bg-brand-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-white">Supports 10+ Export Formats Options</h2>
            <div className="flex flex-wrap justify-center gap-3 ">
                {['PST', 'EML', 'MSG', 'HTML', 'MBOX', 'EMLX', 'PDF', 'DOC', 'JSON', 'TXT'].map((format) => (
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
                <h2 className="text-3xl font-bold text-slate-900 mb-4">We Convert Complete Data from the OST Mailbox to PST</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                <RecoveryCategory 
                    icon={MailIcon} 
                    title="Email" 
                    items={["Email", "CC", "BCC", "From", "Date", "Subject", "Signature"]} 
                />
                <RecoveryCategory 
                    icon={Paperclip} 
                    title="Attachments & File Data" 
                    items={["Documents: PDFs, TXT, DOCS, PPT, etc", "Image File Format: JPG, PNG, BMP, TIFF, etc", "Multimedia Files: Audio & Video Files", "Archive Files: ZIP, RAR, 7Z, TAR"]} 
                />
                <RecoveryCategory 
                    icon={Folder} 
                    title="Folders" 
                    items={["Inbox", "Draft", "Sent Items", "Outbox", "Deleted Items", "Spam Email"]} 
                />
                <RecoveryCategory 
                    icon={Contact} 
                    title="Contacts" 
                    items={["Name", "Email", "Contact Number", "Location"]} 
                />
                <RecoveryCategory 
                    icon={Calendar} 
                    title="Calendar" 
                    items={["Meetings", "Appointments", "All-Day Events", "Recurring Events", "One-Day Events", "Reminders/Notifications"]} 
                />
                <RecoveryCategory 
                    icon={StickyNote} 
                    title="Notes & Tasks" 
                    items={["Note Text, Subject, Color, Category", "Task Title, Due Date, Start Date", "Task Status, Priority"]} 
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
                <h2 className="text-3xl font-bold text-slate-900 mb-4">What Makes Our OST to PST Converter Secure?</h2>
                <p className="text-slate-500 font-medium">Our tool provides quick & secured OST to PST conversion.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SecurityPillarCard 
                    icon={ShieldCheck} 
                    title="Handle Data Safely" 
                    description="We ensure your safe data management without any alteration in the uploaded data." 
                />
                <SecurityPillarCard 
                    icon={ShieldOff} 
                    title="No Data Loss" 
                    description="We ensure all emails, contacts, calendars, and attachments are intact in the same manner." 
                />
                <SecurityPillarCard 
                    icon={Link2Off} 
                    title="Orphaned OST Recovery" 
                    description="Users can access data from disconnected, damaged, and corrupted OST files." 
                />
                <SecurityPillarCard 
                    icon={Lock} 
                    title="Encryption Support" 
                    description="We protect sensitive information during the OST to PST Conversion using TLS 1.3 encryption standards." 
                />
            </div>
        </div>
      </section>

      {/* Common Use Scenarios Section */}
      <section className="py-24 bg-brand-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-16 text-white">Use cases of our OST to PST Converter Software</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                <ScenarioCard 
                    icon={UserMinus} 
                    title="Outlook Profile Removed" 
                    description="When your Outlook profile gets deleted or removed, the OST files sometimes become inaccessible. The tool permits you to extract and convert data from the existing OST file." 
                />
                <ScenarioCard 
                    icon={Server} 
                    title="Exchange Server Crash" 
                    description="While Exchange Server crashes or experiences downtime, many users lost theor mailbox data. The software helps in retrieving data from OST to PST for ongoing access." 
                />
                <ScenarioCard 
                    icon={HeartCrack} 
                    title="OST Becomes Corrupted" 
                    description="The OST file can become corrupted when the system crashes, experiences syncing problems, or undergoes a virus attack. Our tool recovers data from the corrupted OST file and convert into PST." 
                />
                <ScenarioCard 
                    icon={Settings} 
                    title="Switching System" 
                    description="When changing email platforms or creating a new Outlook profile, migrating directly from the OST file is impossible. Our converter helps in changing OST into PST, making the migration easy." 
                />
            </div>
        </div>
      </section>

      {/* Trusted by IT Experts Section */}
      <section className="py-24 bg-white border-b border-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">What Our Client Says</h2>
                <p className="text-slate-500 font-medium">We asked a few of our customers to use our tools and share their honest feedback. Here’s what they say:</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <TestimonialCard 
                    quote="Quick and reliable software- I have converted 20+ OST Files using this tool in easy & minimal steps. Very Efficient and straightforward." 
                    author="Akash" 
                    role="IT Admin" 
                />
                <TestimonialCard 
                    quote="I am looking for this kind of software, which is easy to use and can convert files easily, maintaining the complete hierarchy." 
                    author="Brinley Jones" 
                    role="IT Professional" 
                />
                <TestimonialCard 
                    quote="OST to PST Converter Tool performs flawlessly, offering a smooth, efficient, and high-speed conversion experience." 
                    author="Ava Richardson" 
                    role="IT Operations Manager" 
                />
                <TestimonialCard 
                    quote="The OST to PST Converter turned what could have been a complex email migration into a fast, effortless, and stress-free experience. It maintained the folder hierarchy and recovered all attachments without any loss." 
                    author="Liam Patterson" 
                    role="Systems Engineer" 
                />
                <TestimonialCard 
                    quote="I was concerned about the data safety, but OST to PST Converter ensured a smooth and seamless process." 
                    author="Chloe Bennett" 
                    role="Office Administrator" 
                />
                <TestimonialCard 
                    quote="They handled the whole migration process with professionalism and knowledge. It was seamless and smooth throughout the migration." 
                    author="Ethan Foster" 
                    role="System Engineer" 
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
              { q: "Q1) What is the OST to PST Converter?", a: "Our OST to PST Converter is a tool that helps users convert OST files into PST format while safeguarding data integrity." },
              { q: "Q2) Can I convert OST to PST without MS Outlook?", a: "Yes, you can easily convert OST files into PST format without actually needing MS Outlook." },
              { q: "Q3) What formats can I export my OST file into?", a: "Our tool, OST to PST Converter, can easily convert OST files into 16+ formats such as PDF, EML, DOC, and MSG, etc." },
              { q: "Q4) Does the OST to PST Converter tool support large file sizes?", a: "Yes, our tool ensures that users can hold large file sizes and also divide the file size into smaller data as a resultant PST Format." },
              { q: "Q5) Will my data remain safe and protected during conversion?", a: "Yes, we ensure that during the conversion process, users’ data is safe and secure; we also adhere to all the legal laws and compliance." },
              { q: "Q6) Can I download your OST to PST Converter?", a: "Yes, you can download our OST to PST Converter from our website. Visit our official website, click on the link to download the software." },
              { q: "Q7) Can I convert Orphaned OST to PST files?", a: "Yes, you can easily convert Orphaned OST to PST files by recovering all data, such as emails, contacts, and other data from the old account and saving them in PST format." },
              { q: "Q8) I only have Outlook 16 set up in my system. Will it be connected to the OST to PST converter tool?", a: "Yes, Our Conversion tool is designed to be compatible with all Outlook versions, such as Outlook 2021, 2019, and 2016, and previous versions." },
              { q: "Q9) What kind of data is converted from OST to PST during the conversion process?", a: "Mailbox data, such as Emails, contacts, notes, tasks, and calendars, is converted from OST to PST." },
              { q: "Q10) Will there be any duplicate copies of the original data?", a: "No, our tool is designed to convert the original OST data to PST without creating any duplicates." }
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
  const isModern = title === "User-Friendly Interface";
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
