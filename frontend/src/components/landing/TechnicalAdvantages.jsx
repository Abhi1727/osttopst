import React from "react";
import { useLocation } from "react-router-dom";
import Copy from "lucide-react/dist/esm/icons/copy";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Database from "lucide-react/dist/esm/icons/database";
import Binary from "lucide-react/dist/esm/icons/binary";
import Lock from "lucide-react/dist/esm/icons/lock";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import UserX from "lucide-react/dist/esm/icons/user-x";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import ArrowRightLeft from "lucide-react/dist/esm/icons/arrow-right-left";
import Wrench from "lucide-react/dist/esm/icons/wrench";
import Archive from "lucide-react/dist/esm/icons/archive";

const TechnicalAdvantages = () => {
  const location = useLocation();
  const isPdf = location.pathname === "/ost-to-pdf";
  const isJson = location.pathname === "/ost-to-json";
  const isMbox = location.pathname === "/ost-to-mbox";
  const isEml = location.pathname === "/ost-to-eml";
  const isMsg = location.pathname === "/ost-to-msg";
  const currentFormat = isPdf
    ? "PDF"
    : isJson
      ? "JSON"
      : isMbox
        ? "MBOX"
        : isEml
          ? "EML"
          : isMsg
            ? "MSG"
            : "PST";

  const whyReasonsPst = [
    // {
    //   icon: Database,
    //   title: "Export in 16+ formats",
    //   description:
    //     "Get the 16+ export formats, which provide flexibility. If you require PST, MSG, PDF, EML, MBOX, and other formats, our tool converts OST files into the strucuture that is suitable as per your accessibility.",
    // },
    {
      icon: Database,
      title: "Use Advanced Filters",
      description:
        "Take complete control of data migration through the advanced filters, such as date, year, and filter-based selection, that instantly identify the items with the search feature. This makes sure only the needed data is converted, which saves time and effort.",
    },
    {
      icon: Database,
      title: "Preview Data with Attachments",
      description:
        "With the help of our online tool, you can preview all the mailbox data items containing emails, contacts, calendars, and attachments. You can also verify and choose the same data you want to export without any assumptions.",
    },
    {
      icon: Database,
      title: "Crash of Exchange Server",
      description:
        "A crash of Exchange can cause orphaning of your OST files, so they won't be recognized or available. Our software will allow for the conversion of your orphaned file to a portable, viewable PST file, enabling you to immediately access your data again.",
    },
    {
      icon: UserX,
      title: "Deleted or Expired Office 365 Account",
      description:
        "At the time of expiration of an Office 365 account, the link to the local OST file is effectively broken. You can use our converter to save the complete email history from your account and convert your data from OST to PST prior to getting rid of your account and losing access to your data.",
    },
    {
      icon: UserPlus,
      title: "Account Migration & Your Email",
      description:
        "OST files are linked to a specific computer and profile, making converting email data into PST format very important to be able to make the data portable. In this way, you will be able to import your converted data from PST back into Outlook on any new computer or laptop that has Outlook.",
    },
    {
      icon: ArrowRightLeft,
      title: "Seamless Email Platform Migration",
      description:
        "Are you migrating from Exchange to Gmail or any other 365 tenant? The best way to extract data from the existing email service is by converting the data stored in your OST file to PST format.",
    },
    {
      icon: Wrench,
      title: "Repair Corrupt Files",
      description:
        "There many occurrences of OST header damage due to power failure, syncing issues, etc. The software has built-in repair functionality. It repairs the actual file structures throughout the conversion process for maximum recoverability.",
    },
    {
      icon: Archive,
      title: "Long-Term Email Archive",
      description:
        "OST files are temporary caches, whereas PSTs are considered permanent archives. When converting existing email data from OST format to PST format for long-term retention, you will have a permanent and secure means to retain the email data for records retention purposes.",
    },
  ];

  const whyReasonsPdf = [
    {
      icon: Database,
      title: "Preview Data with Attachments",
      description:
        "With the help of our online tool, you can preview all the mailbox data items containing emails, contacts, calendars, and attachments. You can also verify and choose the same data you want to export without any assumptions.",
    },
    {
      icon: Database,
      title: "Use Advanced Filters",
      description:
        "Take complete control of data migration through the advanced filters, such as date, year, and filter-based selection, that instantly identify the items with the search feature. This makes sure only the needed data is converted, which saves time and effort.",
    },
    {
      icon: Database,
      title: "Crash of Exchange Server",
      description:
        "A crash of Exchange can cause orphaning of your OST files, so they won't be recognized or available. Our software will allow for the conversion of your orphaned file to a portable, viewable PDF file, enabling you to immediately access your data again.",
    },
    {
      icon: UserX,
      title: "Deleted or Expired Office 365 Account",
      description:
        "At the time of expiration of an Office 365 account, the link to the local OST file is effectively broken. You can use our converter to save the complete email history from your account and convert your data from OST to PDF prior to getting rid of your account and losing access to your data.",
    },
    {
      icon: UserPlus,
      title: "Account Migration & Your Email",
      description:
        "OST files are linked to a specific computer and profile, making converting email data into PDF format very important to be able to make the data portable. In this way, you will be able to import your converted data from PDF back into Outlook on any new computer or laptop that has Outlook.",
    },
    {
      icon: ArrowRightLeft,
      title: "Seamless Email Platform Migration",
      description:
        "Are you migrating from Exchange to Gmail or any other 365 tenant? The best way to extract data from the existing email service is by converting the data stored in your OST file to PDF format.",
    },
    {
      icon: Wrench,
      title: "Repair Corrupt Files",
      description:
        "There are many occurrences of OST header damage due to power failure, syncing issues, etc. The software has built-in repair functionality. It repairs the actual file structures throughout the conversion process for maximum recoverability.",
    },
    {
      icon: Archive,
      title: "Long-Term Email Archive",
      description:
        "OST files are temporary caches, whereas PDFs are considered permanent archives. When converting existing email data from OST format to PDF format for long-term retention, you will have a permanent and secure means to retain the email data for records retention purposes.",
    },
  ];

  const whyReasonsJson = [
    {
      icon: Database,
      title: "Preview Data with Attachments",
      description:
        "With the help of our online tool, you can preview all the mailbox data items containing emails, contacts, calendars, and attachments. You can also verify and choose the same data you want to export without any assumptions.",
    },
    {
      icon: Database,
      title: "Use Advanced Filters",
      description:
        "Take complete control of data migration through the advanced filters, such as date, year, and filter-based selection, that instantly identify the items with the search feature. This makes sure only the needed data is converted, which saves time and effort.",
    },
    {
      icon: Database,
      title: "Crash of Exchange Server",
      description:
        "A crash of Exchange can cause orphaning of your OST files, so they won't be recognized or available. Our software will allow for the conversion of your orphaned file to a portable, viewable JSON file, enabling you to immediately access your data again.",
    },
    {
      icon: UserX,
      title: "Deleted or Expired Office 365 Account",
      description:
        "At the time of expiration of an Office 365 account, the link to the local OST file is effectively broken. You can use our converter to save the complete email history from your account and convert your data from OST to JSON prior to getting rid of your account and losing access to your data.",
    },
    {
      icon: UserPlus,
      title: "Account Migration & Your Email",
      description:
        "OST files are linked to a specific computer and profile, making converting email data into JSON format very important to be able to make the data portable. In this way, you will be able to import your converted data from JSON back into Outlook on any new computer or laptop that has Outlook.",
    },
    {
      icon: ArrowRightLeft,
      title: "Seamless Email Platform Migration",
      description:
        "Are you migrating from Exchange to Gmail or any other 365 tenant? The best way to extract data from the existing email service is by converting the data stored in your OST file to JSON format.",
    },
    {
      icon: Wrench,
      title: "Repair Corrupt Files",
      description:
        "There are many occurrences of OST header damage due to power failure, syncing issues, etc. The software has built-in repair functionality. It repairs the actual file structures throughout the conversion process for maximum recoverability.",
    },
    {
      icon: Archive,
      title: "Long-Term Email Archive",
      description:
        "OST files are temporary caches, whereas JSONs are considered permanent archives. When converting existing email data from OST format to JSON format for long-term retention, you will have a permanent and secure means to retain the email data for records retention purposes.",
    },
  ];

  const whyReasonsMbox = [
    {
      icon: Database,
      title: "Preview Data with Attachments",
      description:
        "With the help of our online tool, you can preview all the mailbox data items containing emails, contacts, calendars, and attachments. You can also verify and choose the same data you want to export without any assumptions.",
    },
    {
      icon: Database,
      title: "Use Advanced Filters",
      description:
        "Take complete control of data migration through the advanced filters, such as date, year, and filter-based selection, that instantly identify the items with the search feature. This makes sure only the needed data is converted, which saves time and effort.",
    },
    {
      icon: Database,
      title: "Crash of Exchange Server",
      description:
        "A crash of Exchange can cause orphaning of your OST files, so they won't be recognized or available. Our software will allow for the conversion of your orphaned file to a portable, viewable MBOX file, enabling you to immediately access your data again.",
    },
    {
      icon: UserX,
      title: "Deleted or Expired Office 365 Account",
      description:
        "At the time of expiration of an Office 365 account, the link to the local OST file is effectively broken. You can use our converter to save the complete email history from your account and convert your data from OST to MBOX free prior to getting rid of your account and losing access to your data.",
    },
    {
      icon: UserPlus,
      title: "Account Migration & Your Email",
      description:
        "OST files are linked to a specific computer and profile, making converting email data into MBOX format very important to be able to make the data portable. In this way, you will be able to import your converted data from MBOX back into Outlook on any new computer or laptop that has Outlook.",
    },
    {
      icon: ArrowRightLeft,
      title: "Seamless Email Platform Migration",
      description:
        "Are you migrating from Exchange to Gmail or any other 365 tenant? The best way to extract data from the existing email service is by converting the data stored in your OST file to MBOX format.",
    },
    {
      icon: Wrench,
      title: "Repair Corrupt Files",
      description:
        "There are many occurrences of OST header damage due to power failure, syncing issues, etc. The software has built-in repair functionality. It repairs the actual file structures throughout the conversion process for maximum recoverability.",
    },
    {
      icon: Archive,
      title: "Long-Term Email Archive",
      description:
        "OST files are temporary caches, whereas MBOXs are considered permanent archives. When converting existing email data from OST format to MBOX format for long-term retention, you will have a permanent and secure means to retain the email data for records retention purposes.",
    },
  ];

  const whyReasonsEml = [
    {
      icon: Database,
      title: "Preview Data with Attachments",
      description:
        "With the help of our online tool, you can preview all the mailbox data items containing emails, contacts, calendars, and attachments. You can also verify and choose the same data you want to export without any assumptions.",
    },
    {
      icon: Database,
      title: "Use Advanced Filters",
      description:
        "Take complete control of data migration through the advanced filters, such as date, year, and filter-based selection, that instantly identify the items with the search feature. This makes sure only the needed data is converted, which saves time and effort.",
    },
    {
      icon: Database,
      title: "Crash of Exchange Server",
      description:
        "A crash of Exchange can cause orphaning of your OST files, so they won't be recognized or available. Our software will allow for the conversion of your orphaned file to a portable, viewable EML file, enabling you to immediately access your data again.",
    },
    {
      icon: UserX,
      title: "Deleted or Expired Office 365 Account",
      description:
        "At the time of expiration of an Office 365 account, the link to the local OST file is effectively broken. You can use our converter to save the complete email history from your account and convert your data from OST to EML free prior to getting rid of your account and losing access to your data.",
    },
    {
      icon: UserPlus,
      title: "Account Migration & Your Email",
      description:
        "OST files are linked to a specific computer and profile, making converting email data into EML format very important to be able to make the data portable. In this way, you will be able to import your converted data from EML back into Outlook on any new computer or laptop that has Outlook.",
    },
    {
      icon: ArrowRightLeft,
      title: "Seamless Email Platform Migration",
      description:
        "Are you migrating from Exchange to Gmail or any other 365 tenant? The best way to extract data from the existing email service is by converting the data stored in your OST file to EML format.",
    },
    {
      icon: Wrench,
      title: "Repair Corrupt Files",
      description:
        "There are many occurrences of OST header damage due to power failure, syncing issues, etc. The software has built-in repair functionality. It repairs the actual file structures throughout the conversion process for maximum recoverability.",
    },
    {
      icon: Archive,
      title: "Long-Term Email Archive",
      description:
        "OST files are temporary caches, whereas EMLs are considered permanent archives. When converting existing email data from OST format to EML format for long-term retention, you will have a permanent and secure means to retain the email data for records retention purposes.",
    },
  ];

  const whyReasonsMsg = [
    {
      icon: Database,
      title: "Preview Data with Attachments",
      description:
        "With the help of our online tool, you can preview all the mailbox data items containing emails, contacts, calendars, and attachments. You can also verify and choose the same data you want to export without any assumptions.",
    },
    {
      icon: Database,
      title: "Use Advanced Filters",
      description:
        "Take complete control of data migration through the advanced filters, such as date, year, and filter-based selection, that instantly identify the items with the search feature. This makes sure only the needed data is converted, which saves time and effort.",
    },
    {
      icon: Database,
      title: "Crash of Exchange Server",
      description:
        "A crash of Exchange can cause orphaning of your OST files, so they won't be recognized or available. Our software will allow for the conversion of your orphaned file to a portable, viewable MSG file, enabling you to immediately access your data again.",
    },
    {
      icon: UserX,
      title: "Deleted or Expired Office 365 Account",
      description:
        "At the time of expiration of an Office 365 account, the link to the local OST file is effectively broken. You can use our converter to save the complete email history from your account and convert your data from OST to MSG free prior to getting rid of your account and losing access to your data.",
    },
    {
      icon: UserPlus,
      title: "Account Migration & Your Email",
      description:
        "OST files are linked to a specific computer and profile, making converting email data into MSG format very important to be able to make the data portable. In this way, you will be able to import your converted data from MSG back into Outlook on any new computer or laptop that has Outlook.",
    },
    {
      icon: ArrowRightLeft,
      title: "Seamless Email Platform Migration",
      description:
        "Are you migrating from Exchange to Gmail or any other 365 tenant? The best way to extract data from the existing email service is by converting the data stored in your OST to MSG free format.",
    },
    {
      icon: Wrench,
      title: "Repair Corrupt Files",
      description:
        "There are many occurrences of OST header damage due to power failure, syncing issues, etc. The software has built-in repair functionality. It repairs the actual file structures throughout the conversion process for maximum recoverability.",
    },
    {
      icon: Archive,
      title: "Long-Term Email Archive",
      description:
        "OST files are temporary caches, whereas MSGs are considered permanent archives. When converting existing email data from OST format to MSG format for long-term retention, you will have a permanent and secure means to retain the email data for records retention purposes.",
    },
  ];

  const whyReasons = isPdf
    ? whyReasonsPdf
    : isJson
      ? whyReasonsJson
      : isMbox
        ? whyReasonsMbox
        : isEml
          ? whyReasonsEml
          : isMsg
            ? whyReasonsMsg
            : whyReasonsPst;

  const darkSectionSubtitle = isPdf
    ? "OST to PDF free converter software"
    : isJson
      ? "OST to JSON free converter software"
      : isMbox
        ? "OST to MBOX free converter software"
        : isEml
          ? "OST to EML free converter software"
          : isMsg
            ? "OST to MSG free converter software"
            : "free OST to PST converter software";
  return (
    <section className="flex items-center py-1 md:py-2 px-4 md:px-6 lg:px-12 bg-brand-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Technical Advantages */}
        <div className="space-y-8 md:space-y-10">
          <div className="text-center space-y-2 px-2">
            <h2 className=" text-2xl sm:text-3xl md:text-4xl font-bold">
              Technical <span className="text-brand-500">Advantages</span> We
              Offer
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-medium">
              We tackle the complex technical challenges that traditional
              software often struggles with.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <div className="w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-2rem)] xl:w-[calc(25%-2rem)]">
              <AdvantageCard
                icon={Wrench}
                title="Repairing Corruption"
                description="OST files can suffer from 'unexpected shutdowns.' We utilize professional-grade tools to fix header errors during the conversion process."
              />
            </div>
            <div className="w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-2rem)] xl:w-[calc(25%-2rem)]">
              <AdvantageCard
                icon={Copy}
                title="Deduplication"
                description={`We eliminate duplicate emails along the way, resulting in a final ${currentFormat} file that is smaller, cleaner, and more efficient.`}
              />
            </div>
            <div className="w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-2rem)] xl:w-[calc(25%-2rem)]">
              <AdvantageCard
                icon={ShieldCheck}
                title="Enterprise Security"
                description="We ensure a secure, encrypted pipeline for data transfer, avoiding the risks associated with dubious 'free' converters."
              />
            </div>
          </div>
        </div>

        {/* Why Use Our Online Tool? */}
        <div className="space-y-8 md:space-y-10">
          <div className="text-center space-y-2 px-2">
            <h2 className=" text-2xl sm:text-3xl md:text-4xl font-bold">
              Why Use Our Online <span className="text-brand-500">Tool</span>?
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-medium">
              Experience the most reliable and efficient OST to {currentFormat}{" "}
              conversion service available online.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {whyReasons.map((reason, index) => (
              <div
                key={index}
                className="w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-2rem)] xl:w-[calc(25%-2rem)]"
              >
                <AdvantageCard
                  icon={reason.icon}
                  title={reason.title}
                  description={reason.description}
                />
              </div>
            ))}
          </div>
        </div>

        {/* PST File Variants - Dark Section */}
        <div className="bg-black rounded-3xl md:rounded-[40px] p-8 md:p-12 text-white text-center space-y-8 md:space-y-10 shadow-2xl overflow-hidden relative">
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Supports All{" "}
              <span className="text-brand-500">OST and {currentFormat}</span>{" "}
              File Variants
            </h2>
            <p className="max-w-4xl mx-auto text-slate-300 text-sm sm:text-base md:text-lg font-medium leading-relaxed opacity-90 px-0 sm:px-4">
              Our {darkSectionSubtitle} is engineered to handle every variant of
              OST and {currentFormat} files you might encounter.{" "}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 sm:gap-y-6 gap-x-4 max-w-5xl mx-auto text-left text-slate-300 text-sm md:text-base font-semibold px-0 sm:px-4">
            {[
              "Unicode format (2007+)",
              "ANSI format (97-2003)",
              "Exchange Server versions",
              "Encrypted OST files",
              "Password-protected files",
              "32-bit & 64-bit Outlook",
              "Outlook for Microsoft 365",
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                {item}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <SmallFeature icon={Binary} label="Unicode & ANSI" />
            <SmallFeature icon={Lock} label="Encrypted Files" />
            <SmallFeature icon={Database} label="Exchange Support" />
            <SmallFeature icon={ShieldAlert} label="Password Recovery" />
          </div>
        </div>
      </div>
    </section>
  );
};

const AdvantageCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-4 hover:shadow-lg transition-all transform hover:-translate-y-1 h-full">
    <div className="text-slate-700">
      <Icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
    </div>
    <div className="space-y-2 md:space-y-3">
      <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
        {title}
      </h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[280px]">
        {description}
      </p>
    </div>
  </div>
);

const SmallFeature = ({ icon: Icon, label }) => (
  <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center gap-3 sm:gap-4 text-center group hover:bg-white/20 transition-all cursor-default">
    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={1.5} />
    <span className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-widest leading-tight">
      {label}
    </span>
  </div>
);

export default TechnicalAdvantages;
