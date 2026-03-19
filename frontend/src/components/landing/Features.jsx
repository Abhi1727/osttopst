// import React from "react";
// import { 
//   ShieldCheck, 
//   MonitorOff, 
//   Cloud, 
//   CircleDollarSign, 
//   EyeOff, 
//   Zap, 
//   Database, 
//   UserCircle2, 
//   CalendarCheck, 
//   Files, 
//   Scissors, 
//   ExternalLink 
// } from "lucide-react";

// const FeatureCard = ({ icon: Icon, title, description }) => (
//   <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-100 flex flex-col items-center text-center gap-4 md:gap-6 hover:shadow-2xl hover:shadow-brand-500/10 transition-all hover:-translate-y-1 group">
//     <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
//       <Icon className="w-8 h-8 text-brand-600 group-hover:text-white" />
//     </div>
//     <div className="space-y-2 md:space-y-4">
//       <h3 className="text-lg md:text-2xl font-bold text-slate-900 leading-tight tracking-tight uppercase">{title}</h3>
//       <p className="text-slate-500 text-sm md:text-base font-normal leading-relaxed">
//         {description}
//       </p>
//     </div>
//   </div>
// );

// const Features = () => {
//   const features = [
//     {
//       icon: ShieldCheck,
//       title: "SSL Security",
//       description: "Protect all of your data with end-to-end SSL encryption from unauthorized access."
//     },
//     {
//       icon: MonitorOff,
//       title: "No Outlook Needed",
//       description: "Manage your documents using our online system without needing any desktop software."
//     },
//     {
//       icon: Cloud,
//       title: "Cloud Infrastructure",
//       description: "Enjoy rapid-speed processing on an established cloud infrastructure with zero pause in operations."
//     },
//     {
//       icon: CircleDollarSign,
//       title: "Free File Conversion",
//       description: "Automatically convert your files into any required format with our advanced conversion engine."
//     },
//     {
//       icon: EyeOff,
//       title: "Privacy Guaranteed",
//       description: "Files are automatically deleted from our servers after 2 hours."
//     },
//     {
//       icon: Zap,
//       title: "Fast Processing",
//       description: "Cloud-based high-speed engines process large files in minutes."
//     },
//     {
//       icon: Database,
//       title: "Full Data Integrity",
//       description: "Maintains folder hierarchy, attachments, and rich-text formatting."
//     },
//     {
//       icon: UserCircle2,
//       title: "User Friendly UI",
//       description: "Intuitive interface designed for touch, making file management effortless on any mobile device."
//     },
//     {
//       icon: CalendarCheck,
//       title: "Supports Outlook 2021",
//       description: "Compatible With Outlook 2021 And Earlier Versions. Compatible with all versions of Outlook 2021 and below."
//     },
//     {
//       icon: Files,
//       title: "Batch Conversion",
//       description: "Convert multiple OST files simultaneously to save time and effort."
//     },
//     {
//       icon: Scissors,
//       title: "Split Large PST",
//       description: "Automatically split oversized PST files for better Outlook performance."
//     },
//     {
//       icon: ExternalLink,
//       title: "Direct Migration",
//       description: "Migrate OST directly to Gmail, Outlook.com, and Yahoo accounts."
//     }
//   ];

//   return (
//     <section className="min-h-screen flex items-center py-16 md:py-24 bg-slate-50/50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-12 md:mb-20">
//           <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
//             Features that Make It <span className="text-brand-600">Powerful</span>
//           </h2>
//           <p className="mt-4 text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
//             Everything you need for a professional-grade OST to PST conversion.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
//           {features.map((feature, index) => (
//             <FeatureCard key={index} {...feature} />
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default Features;
