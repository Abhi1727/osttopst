import React from "react";
import { Lock, FolderTree, FileText, Shield } from "lucide-react";

const FeatureCard = ({ icon: Icon, title, description, badgeColor }) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-2xl ${badgeColor}`}>
      <Icon className="w-6 h-6 text-emerald-700" />
    </div>
    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: Lock,
      title: "Crash of Exchange Server",
      description:
        "Crash of Exchange can cause orphaning of your OST files, so they won't be recognized or available. Our software will allow for conversion of your orphaned file to a portable, viewable PST file enabling you immediate access to your data again.",
      badgeColor: "bg-emerald-50",
    },
    {
      icon: FolderTree,
      title: "Deleted or Expired Office 365 Account",
      description:
         "At the time of expiration of an Office 365 account, the link to the local OST file is effectively broken. You can use our converter to save the complete email history from your account and convert your data from OST to PST prior to getting rid of your account and losing access to your data.",
      badgeColor: "bg-emerald-50",
    },
    {
      icon: FileText,
      title: "Account Migration & Your Email",
      description:
          "OST files are linked to a specific computer and profile, making converting email data into PST format very important to be able to make the data portable. In this way, you will be able to import your converted data from PST back into Outlook on any new computer or laptop that has Outlook.",
      badgeColor: "bg-emerald-50",
    },
    {
      icon: FileText,
      title: "Seamless Email Platform Migration",
      description:
         "Are you migrating from Exchange to Gmail or any other 365 tenant? The best way to extract data from the existing email service is by converting the data stored in your OST file to PST format.",
      badgeColor: "bg-emerald-50",
    },
    {
      icon: FileText,
      title: "Repair Corrupt Files",
      description:
        "There are many occurrences of OST header damage due to power failure, syncing issues etc. The software has built-in repair functionality. It repairs the actual file structures throughout the conversion process for maximum recoverability.", 
     badgeColor: "bg-emerald-50",
    },
    {
      icon: FileText,
      title: "Long-Term Email Archive",
      description:
         " OST files are temporary caches whereas PSTs are considered permanent archives. When converting existing email data from OST format to PST format for long-term retention, you will have a permanent and secure means to retain the email data for records retention purposes.",
      badgeColor: "bg-emerald-50",
    },
  ];

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 lg:px-12 bg-slate-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-800">
            Why Use Our Online Tool? 
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

    
      </div>
    </section>
  );
};

export default Features;
