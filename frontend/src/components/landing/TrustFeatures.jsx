import React from "react";
import {
  ShieldCheck,
  Layout,
  Cloud,
  FileType,
  Trash2,
  Zap,
  FolderTree,
  Smartphone,
  Scissors,
  CloudUpload,
  Database,
  Boxes,
} from "lucide-react";

const TrustFeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-start p-6 md:p-10 rounded-2xl md:rounded-3xl bg-white border border-slate-100 hover:shadow-2xl hover:shadow-brand-500/10 transition-all group">
    <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-50 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-brand-500 group-hover:text-white transition-all">
      <Icon className="w-5 h-5 md:w-7 md:h-7 text-brand-600 group-hover:text-white" />
    </div>
    <h4 className="font-black text-slate-900 mb-2 md:mb-4 text-lg md:text-xl tracking-tight leading-tight">{title}</h4>
    <p className="text-slate-500 font-semibold leading-relaxed text-xs md:text-base">
      {description}
    </p>
  </div>
);

const TrustFeatures = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: "SSL Security",
      description:
        "Protect all of your data with end-to-end SSL encryption from unauthorized access.",
    },
    {
      icon: Layout,
      title: "No Outlook Needed",
      description:
        "Manage your documents using our online system without needing any desktop software.",
    },
    {
      icon: Cloud,
      title: "Cloud Infrastructure",
      description:
        "Enjoy rapid-speed processing on an established cloud infrastructure with zero pause in operations.",
    },
    {
      icon: FileType,
      title: "Free File Conversion",
      description:
        "Automatically convert your files into any required format with our advanced conversion engine.",
    },
    {
      icon: Trash2,
      title: "Privacy Guaranteed",
      description:
        "Files are automatically deleted from our servers after 2 hours.",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description:
        "Cloud-based high-speed engines process large files in minutes.",
    },
    {
      icon: FolderTree,
      title: "Full Data Integrity",
      description:
        "Maintains folder hierarchy, attachments, and rich-text formatting.",
    },
    {
      icon: Smartphone,
      title: "User Friendly UI",
      description:
        "Intuitive interface designed for touch, making file management effortless on any mobile device.",
    },
    {
      icon: Database,
      title: "Supports Outlook 2021",
      description:
        "Compatible With Outlook 2021 And Earlier Versions Compatible with all versions of outlook 2021 and below. ",
    },
    {
      icon: Boxes,
      title: "Batch Conversion",
      description:
        "Convert multiple OST files simultaneously to save time and effort.",
    },
    {
      icon: Scissors,
      title: "Split Large PST",
      description:
        "Automatically split oversized PST files for better Outlook performance.",
    },
    {
      icon: CloudUpload,
      title: "Direct Migration",
      description:
        "Migrate OST directly to Gmail, Outlook.com, and Yahoo accounts.",
    },
  ];

  return (
    <section className="py-10 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-10 md:mb-20">
          <h2 className="text-2xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
            Our Professional <span className="header-text-gradient">Capabilities</span>
          </h2>
          <p className="mt-2 md:mt-6 text-slate-500 text-sm md:text-lg lg:text-xl font-semibold max-w-2xl mx-auto leading-relaxed">
            Advanced features designed to handle even the most complex Outlook data migration scenarios.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {features.map((feature, index) => (
            <TrustFeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustFeatures;
