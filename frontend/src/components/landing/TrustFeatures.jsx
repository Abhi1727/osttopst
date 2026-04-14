import { useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Box,
  Cloud,
  FileText,
  Trash2,
  Zap,
  Scissors,
  CloudUpload,
} from "lucide-react";

const TrustFeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col items-center text-center space-y-6 hover:shadow-md transition-shadow">
    <div className="text-slate-900">
      <Icon className="w-10 h-10 md:w-12 md:h-12 stroke-[1.2]" />
    </div>
    <div className="space-y-4">
      <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
        {title}
      </h3>
      <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
        {description}
      </p>
    </div>
  </div>
);

const TrustFeatures = () => {
  const location = useLocation();
  const isPdf = location.pathname === "/ost-to-pdf";
  const isMbox = location.pathname === "/ost-to-mbox";
  const isEml = location.pathname === "/ost-to-eml";

  const defaultFeatures = [
    {
      icon: ShieldCheck,
      title: "SSL Security",
      description: "Protect all of your data with end-to-end SSL encryption from unauthorized access.",
    },
    {
      icon: Box,
      title: "No Outlook Needed",
      description: "Manage your documents using our online system without needing any desktop software.",
    },
    {
      icon: Cloud,
      title: "Cloud Infrastructure",
      description: "Enjoy rapid-speed processing on an established cloud infrastructure with zero pause in operations.",
    },
    {
      icon: FileText,
      title: "Free File Conversion",
      description: "Automatically convert your files into any required format with our advanced conversion engine.",
    },
    {
      icon: Trash2,
      title: "Privacy Guaranteed",
      description: "Files are automatically deleted from our servers after 2 hours.",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Cloud-based high-speed engines process large files in minutes.",
    },
    {
      icon: ShieldCheck,
      title: "Full Data Integrity",
      description: "Maintains folder hierarchy, attachments, and rich-text formatting.",
    },
    {
      icon: Box,
      title: "User Friendly UI",
      description: "Our Tool UI is user friendly, making file management effortless and easy to navigate.",
    },
    {
      icon: Cloud,
      title: "Supports Outlook 2021 & Earlier",
      description: "Compatible with all versions of Outlook 2021 and below. We have no restrictions for using Outlook.",
    },
    {
      icon: Box,
      title: "Batch Conversion",
      description: "Convert multiple OST files simultaneously to save time and effort.",
    },
    {
      icon: Scissors,
      title: "Split Large PST",
      description: "Automatically split oversized PST files for better Outlook performance.",
    },
    {
      icon: CloudUpload,
      title: "Direct Migration",
      description: "Users can easily migrate PST files directly to Gmail, Outlook and Yahoo accounts.",
    },
  ];

  const pdfFeatures = [
    {
      icon: ShieldCheck,
      title: "SSL Security",
      description: "Protect all of your data with end-to-end SSL encryption from unauthorized access.",
    },
    {
      icon: Box,
      title: "No Outlook Needed",
      description: "Manage your documents using our online system without needing any desktop software.",
    },
    {
      icon: Cloud,
      title: "Cloud Infrastructure",
      description: "Enjoy rapid-speed processing on an established cloud infrastructure with zero pause in operations.",
    },
    {
      icon: FileText,
      title: "Free File Conversion",
      description: "Automatically convert your files into any required format with our advanced conversion engine.",
    },
    {
      icon: Trash2,
      title: "Privacy Guaranteed",
      description: "Files are automatically deleted from our servers after 2 hours.",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Cloud-based high-speed engines process large files in minutes.",
    },
    {
      icon: ShieldCheck,
      title: "Full Data Integrity",
      description: "Maintains folder hierarchy, attachments, and rich-text formatting.",
    },
    {
      icon: Box,
      title: "User Friendly UI",
      description: "Our Tool UI is user-friendly, making file management effortless to navigate.",
    },
    {
      icon: Cloud,
      title: "Supports Outlook 2021 & Earlier",
      description: "Compatible with all versions of Outlook 2021 and below. We have no restrictions on using Outlook.",
    },
    {
      icon: Box,
      title: "Batch Conversion",
      description: "Convert multiple OST files simultaneously to save time and effort.",
    },
    {
      icon: CloudUpload,
      title: "Direct Migration",
      description: "Users can easily migrate PDF files directly to Gmail, Outlook, and Yahoo accounts.",
    },
  ];

  const mboxFeatures = [
    {
      icon: ShieldCheck,
      title: "SSL Security",
      description: "Protect all of your data with end-to-end SSL encryption from unauthorized access.",
    },
    {
      icon: Box,
      title: "No Outlook Needed",
      description: "Manage your documents using our online system without needing any desktop software.",
    },
    {
      icon: Cloud,
      title: "Cloud Infrastructure",
      description: "Enjoy rapid-speed processing on an established cloud infrastructure with zero pause in operations.",
    },
    {
      icon: FileText,
      title: "Free File Conversion",
      description: "Automatically convert your files into any required format with our advanced conversion engine.",
    },
    {
      icon: Trash2,
      title: "Privacy Guaranteed",
      description: "Files are automatically deleted from our servers after 2 hours.",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Cloud-based high-speed engines process large files in minutes.",
    },
    {
      icon: ShieldCheck,
      title: "Full Data Integrity",
      description: "Maintains folder hierarchy, attachments, and rich-text formatting.",
    },
    {
      icon: Box,
      title: "User Friendly UI",
      description: "Our Tool UI is user-friendly, making file management effortless to navigate.",
    },
    {
      icon: Cloud,
      title: "Supports Outlook 2021 & Earlier",
      description: "Compatible with all versions of Outlook 2021 and below. We have no restrictions on using Outlook.",
    },
    {
      icon: Box,
      title: "Batch Conversion",
      description: "Convert multiple OST files simultaneously to save time and effort.",
    },
    {
      icon: CloudUpload,
      title: "Direct Migration",
      description: "Users can easily migrate MBOX files directly to Gmail, Outlook, and Yahoo accounts.",
    },
  ];

  const emlFeatures = [
    {
      icon: ShieldCheck,
      title: "SSL Security",
      description: "Protect all of your data with end-to-end SSL encryption from unauthorized access.",
    },
    {
      icon: Box,
      title: "No Outlook Needed",
      description: "Manage your documents using our online system without needing any desktop software.",
    },
    {
      icon: Cloud,
      title: "Cloud Infrastructure",
      description: "Enjoy rapid-speed processing on an established cloud infrastructure with zero pause in operations.",
    },
    {
      icon: FileText,
      title: "Free File Conversion",
      description: "Automatically convert your files into any required format with our advanced conversion engine.",
    },
    {
      icon: Trash2,
      title: "Privacy Guaranteed",
      description: "Files are automatically deleted from our servers after 2 hours.",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Cloud-based high-speed engines process large files in minutes.",
    },
    {
      icon: ShieldCheck,
      title: "Full Data Integrity",
      description: "Maintains folder hierarchy, attachments, and rich-text formatting.",
    },
    {
      icon: Box,
      title: "User Friendly UI",
      description: "Our Tool UI is user-friendly, making file management effortless to navigate.",
    },
    {
      icon: Cloud,
      title: "Supports Outlook 2021 & Earlier",
      description: "Compatible with all versions of Outlook 2021 and below. We have no restrictions on using Outlook.",
    },
    {
      icon: Box,
      title: "Batch Conversion",
      description: "Convert multiple OST files simultaneously to save time and effort.",
    },
    {
      icon: CloudUpload,
      title: "Direct Migration",
      description: "Users can easily migrate EML files directly to Gmail, Outlook, and Yahoo accounts.",
    },
  ];

  const features = isPdf ? pdfFeatures : isMbox ? mboxFeatures : isEml ? emlFeatures : defaultFeatures;

  return (
    <section className="bg-[#f0f9ff] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          {/* <h2 className=" text-3xl md:text-4xl font-extrabold tracking-tight">
            Our Professional <span className="text-[#0EA5E9]">Capabilities</span>
          </h2> */}
          <h2 className=" text-3xl md:text-4xl font-extrabold tracking-tight">
            Features that Make It <span className="text-[#0EA5E9]">Powerful</span>
          </h2>
          <p className="text-slate-600 text-lg font-medium max-w-3xl mx-auto leading-relaxed">
            Advanced features designed to handle even the most complex Outlook data migration scenarios.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <TrustFeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustFeatures;

