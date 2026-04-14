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
  <div className="bg-white p-4 md:p-6 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex flex-col items-center text-center space-y-3 hover:shadow-md transition-shadow h-full">
    <div className="text-[#0EA5E9]">
      <Icon className="w-8 h-8 md:w-10 md:h-10 stroke-[1.5]" />
    </div>
    <div className="space-y-2">
      <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">
        {title}
      </h3>
      <p className="text-slate-500 font-medium leading-relaxed text-xs md:text-sm">
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
      description:
        "Protect all of your data with end-to-end SSL encryption from unauthorized access.",
    },
    {
      icon: Box,
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
      icon: FileText,
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
      icon: ShieldCheck,
      title: "Full Data Integrity",
      description:
        "Maintains folder hierarchy, attachments, and rich-text formatting.",
    },
    {
      icon: Box,
      title: "User Friendly UI",
      description:
        "Our Tool UI is user friendly, making file management effortless and easy to navigate.",
    },
    {
      icon: Cloud,
      title: "Supports Outlook 2021 & Earlier",
      description:
        "Compatible with all versions of Outlook 2021 and below. We have no restrictions for using Outlook.",
    },
    {
      icon: Box,
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
        "Users can easily migrate PST files directly to Gmail, Outlook and Yahoo accounts.",
    },
  ];

  const pdfFeatures = [
    {
      icon: ShieldCheck,
      title: "SSL Security",
      description:
        "Protect all of your data with end-to-end SSL encryption from unauthorized access.",
    },
    {
      icon: Box,
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
      icon: FileText,
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
      icon: ShieldCheck,
      title: "Full Data Integrity",
      description:
        "Maintains folder hierarchy, attachments, and rich-text formatting.",
    },
    {
      icon: Box,
      title: "User Friendly UI",
      description:
        "Our Tool UI is user-friendly, making file management effortless to navigate.",
    },
    {
      icon: Cloud,
      title: "Supports Outlook 2021 & Earlier",
      description:
        "Compatible with all versions of Outlook 2021 and below. We have no restrictions on using Outlook.",
    },
    {
      icon: Box,
      title: "Batch Conversion",
      description:
        "Convert multiple OST files simultaneously to save time and effort.",
    },
    {
      icon: CloudUpload,
      title: "Direct Migration",
      description:
        "Users can easily migrate PDF files directly to Gmail, Outlook, and Yahoo accounts.",
    },
  ];

  const mboxFeatures = [
    {
      icon: ShieldCheck,
      title: "SSL Security",
      description:
        "Protect all of your data with end-to-end SSL encryption from unauthorized access.",
    },
    {
      icon: Box,
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
      icon: FileText,
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
      icon: ShieldCheck,
      title: "Full Data Integrity",
      description:
        "Maintains folder hierarchy, attachments, and rich-text formatting.",
    },
    {
      icon: Box,
      title: "User Friendly UI",
      description:
        "Our Tool UI is user-friendly, making file management effortless to navigate.",
    },
    {
      icon: Cloud,
      title: "Supports Outlook 2021 & Earlier",
      description:
        "Compatible with all versions of Outlook 2021 and below. We have no restrictions on using Outlook.",
    },
    {
      icon: Box,
      title: "Batch Conversion",
      description:
        "Convert multiple OST files simultaneously to save time and effort.",
    },
    {
      icon: CloudUpload,
      title: "Direct Migration",
      description:
        "Users can easily migrate MBOX files directly to Gmail, Outlook, and Yahoo accounts.",
    },
  ];

  const emlFeatures = [
    {
      icon: ShieldCheck,
      title: "SSL Security",
      description:
        "Protect all of your data with end-to-end SSL encryption from unauthorized access.",
    },
    {
      icon: Box,
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
      icon: FileText,
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
      icon: ShieldCheck,
      title: "Full Data Integrity",
      description:
        "Maintains folder hierarchy, attachments, and rich-text formatting.",
    },
    {
      icon: Box,
      title: "User Friendly UI",
      description:
        "Our Tool UI is user-friendly, making file management effortless to navigate.",
    },
    {
      icon: Cloud,
      title: "Supports Outlook 2021 & Earlier",
      description:
        "Compatible with all versions of Outlook 2021 and below. We have no restrictions on using Outlook.",
    },
    {
      icon: Box,
      title: "Batch Conversion",
      description:
        "Convert multiple OST files simultaneously to save time and effort.",
    },
    {
      icon: CloudUpload,
      title: "Direct Migration",
      description:
        "Users can easily migrate EML files directly to Gmail, Outlook, and Yahoo accounts.",
    },
  ];

  const features = isPdf
    ? pdfFeatures
    : isMbox
      ? mboxFeatures
      : isEml
        ? emlFeatures
        : defaultFeatures;

  return (
    <section className="bg-brand-50 py-1 md:py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 space-y-2">
          {/* <h2 className=" text-3xl md:text-4xl font-extrabold tracking-tight">
            Our Professional <span className="text-[#0EA5E9]">Capabilities</span>
          </h2> */}
          <h2 className=" text-3xl md:text-4xl font-extrabold tracking-tight">
            Features that Make It{" "}
            <span className="text-[#0EA5E9]">Powerful</span>
          </h2>
          <p className="text-slate-600 text-lg font-medium mx-auto leading-relaxed">
            Advanced features designed to handle even the most complex Outlook data migration scenarios.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {features.map((feature, index) => (
            <div key={index} className="w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.33%-1rem)] lg:w-[calc(25%-1.125rem)]">
              <TrustFeatureCard {...feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustFeatures;
