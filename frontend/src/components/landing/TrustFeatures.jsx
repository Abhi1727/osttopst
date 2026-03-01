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
} from "lucide-react";

const TrustFeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
    <div className="p-4 rounded-2xl bg-emerald-50 mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-10 h-10 text-emerald-600" />
    </div>
    <h4 className="font-black text-slate-800 mb-3 text-lg">{title}</h4>
    <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">
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
  ];

  return (
    <section className="py-20 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Our Capabilities
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <TrustFeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustFeatures;
