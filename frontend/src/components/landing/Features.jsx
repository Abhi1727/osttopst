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
      title: "Exchange server crash",
      description:
        "If an Exchange server crashes, the OST file will lose its connection to the Exchange server and become “orphaned.” Using our software to convert the OST to PST will allow you to recover all of the readable items in your OST file and save them into a viewable, portable PST file.",
      badgeColor: "bg-emerald-50",
    },
    {
      icon: FolderTree,
      title: "You’ve deleted or expired your Office 365 Account",
      description:
        "When your Office 365 or Exchange account has been deleted or expired, it causes the local OST file to lose its connection to the Exchange server. Therefore, converting an OST to a PST using our free software will allow you to preserve the contents of your email history before you delete the account or before it expires.",
      badgeColor: "bg-emerald-50",
    },
    {
      icon: FileText,
      title: "Expired Office 365 Account",
      description:
        "If your Office 365 account has expired, the local OST file will become disconnected. This means that the only way to keep your email history after you’ve deleted your Office 365 account (or after it expires) is to convert your OST to a PST, as described above.",
      badgeColor: "bg-emerald-50",
    },
    {
      icon: FileText,
      title: "You are setting up a new computer or reinstalling Outlook",
      description:
        "OST files are machine and profile dependent. You cannot copy the OST file from one computer to another computer and import it into Outlook. You must convert the OST into a PST before being able to import it into Outlook on another machine. Converting the OST to a PST beforehand makes the file fully portable, allowing you to import it into Outlook on any computer.",
      badgeColor: "bg-emerald-50",
    },
    {
      icon: FileText,
      title: "Migration of Email Platforms",
      description:
        "Are you seeking a service to aid you in migrating your emails? If you're considering switching from Exchange to Gmail, or moving from one Office 365 tenant to another, the easiest method for migrating your email data is to extract your local OST file into PST format; this is an easy way to correctly separate your email data, so you may later import them back into the new emailing system.",
      badgeColor: "bg-emerald-50",
    },
    {
      icon: FileText,
      title: "Repair the Corruption of Your OST File",
      description:
        "OST files sometimes experience corruption and stop being usable because of sync issues and power outages, as well as due to disk corruption. The OST-to-PST file converter provided by us has functionality built into it for automatically fixing the header (structure) of the file so you get as much data out of your corrupted file, prior to losing it completely.",
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

        <div className="mt-20 grid md:grid-cols-3 gap-8 border-t border-slate-200 pt-12">
          <div className="flex gap-4">
            <div className="p-2 rounded-full h-fit">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Privacy Guaranteed</h4>
              <p className="text-xs text-slate-500 mt-1">
                Files are automatically deleted from our servers after 2 hours.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-2 rounded-full h-fit">
              <FolderTree className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Full Data Integrity</h4>
              <p className="text-xs text-slate-500 mt-1">
                Maintains folder hierarchy, attachments, and rich-text
                formatting.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-2 rounded-full h-fit">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Fast Processing</h4>
              <p className="text-xs text-slate-500 mt-1">
                Cloud-based high-speed engines process large files in minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
