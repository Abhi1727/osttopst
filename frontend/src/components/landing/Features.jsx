import React from "react";
import { Lock, FolderTree, FileText, Shield, ArrowRight } from "lucide-react";

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-100 flex flex-col items-center text-center gap-4 md:gap-6 hover:shadow-2xl hover:shadow-brand-500/10 transition-all hover:-translate-y-1 group">
    <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
      <Icon className="w-8 h-8 text-brand-600 group-hover:text-white" />
    </div>
    <div className="space-y-2 md:space-y-4">
      <h3 className="text-lg md:text-2xl font-black text-slate-900 leading-tight">{title}</h3>
      <p className="text-slate-500 text-sm md:text-base font-semibold leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "100% Secure & Private",
      description:
        "Your data is processed locally and securely. We prioritize privacy and security, ensuring your files never leave your system during the conversion process.",
      badgeColor: "bg-brand-50",
    },
    {
      icon: FolderTree,
      title: "Deleted or Expired Office 365 Account",
      description:
        "At the time of expiration of an Office 365 account, the link to the local OST file is effectively broken. You can use our converter to save the complete email history from your account and convert your data from OST to PST prior to getting rid of your account and losing access to your data.",
      badgeColor: "bg-brand-50",
    },
    {
      icon: FolderTree,
      title: "Maintain Folder Structure",
      description:
        "The software preserves the original internal structure of OST files during conversion. All folders and subfolders are kept exactly as they were, ensuring no data reorganization is needed.",
      badgeColor: "bg-brand-50",
    },
    {
      icon: FileText,
      title: "Seamless Email Platform Migration",
      description:
        "Are you migrating from Exchange to Gmail or any other 365 tenant? The best way to extract data from the existing email service is by converting the data stored in your OST file to PST format.",
      badgeColor: "bg-brand-50",
    },
    {
      icon: FileText,
      title: "Repair Corrupt Files",
      description:
        "There are many occurrences of OST header damage due to power failure, syncing issues, etc. The software has built-in repair functionality. It repairs the actual file structures throughout the conversion process for maximum recoverability.",
      badgeColor: "bg-brand-50",
    },
    {
      icon: FileText,
      title: "Deep Meta-Data Extraction",
      description:
        "Extract every detail including ‘To’, ‘Cc’, ‘Bcc’, ‘Subject’, ‘Sent/Received Date’, and attachments. Pure meta-data preservation ensures your emails remain forensically intact.",
      badgeColor: "bg-brand-50",
    },
  ];

  return (
    <section className="py-10 md:py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-20">
          <h2 className="text-2xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
            Why Use Our <span className="header-text-gradient">Online Tool?</span>
          </h2>
          <p className="mt-2 md:mt-6 text-slate-500 text-sm md:text-lg lg:text-xl font-semibold max-w-2xl mx-auto">
            Experience the most reliable and efficient OST to PST conversion service available online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
