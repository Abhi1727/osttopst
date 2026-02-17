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
      title: "Secure Upload & Conversion",
      description:
        "Uses SSL encryption for secure upload of OST files that are deleted from our servers within 24 hours after conversion.",
      badgeColor: "bg-emerald-50",
    },
    {
      icon: FolderTree,
      title: "Preserves Folder Structure",
      description:
        "Retains the original folder structure and mailbox hierarchy, keeping your data organized and structured as it was in the OST file.",
      badgeColor: "bg-emerald-50",
    },
    {
      icon: FileText,
      title: "HTML Preview of Converted Data",
      description:
        "The tool provides a HTML-based preview for OST file ≤500MB, allowing you to review your data before downloading the converted PST file.",
      badgeColor: "bg-emerald-50",
    },
  ];

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 lg:px-12 bg-slate-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-800">
            Highlights of OST to PST Online Conversion Tool
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
