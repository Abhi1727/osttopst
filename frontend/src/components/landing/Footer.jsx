import React from "react";
import { Link } from "react-router-dom";
import Mail from "lucide-react/dist/esm/icons/mail";
import Github from "lucide-react/dist/esm/icons/github";
import Twitter from "lucide-react/dist/esm/icons/twitter";
import Linkedin from "lucide-react/dist/esm/icons/linkedin";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "OST to PST Converter", path: "/" },
        { label: "OST Viewer", path: "/ost-viewer" },
        { label: "Pricing / Plans", path: "/our-plans" },
        { label: "Download Deskstop Tool", path: "/#download" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blogs", path: "/blogs" },
        { label: "F.A.Q", path: "/faq" },
        { label: "Technical Support", path: "/contact-us" },
        { label: "How it Works", path: "/#how-it-works" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", path: "/privacy-policy" },
        { label: "Terms & Conditions", path: "/terms-conditions" },
        { label: "Refund Policy", path: "/refund-policy" },
      ],
    },
  ];

  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto selection:bg-brand-100 selection:text-brand-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center p-1.5 rounded-lg bg-[#0078d4] group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                OST to PST <span className="text-brand-600">Converter</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-sm font-medium">
              Enterprise-grade recovery solution for converting orphaned OST files to Outlook PST and 16+ popular formats with 100% data integrity.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="p-2 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-100 hover:bg-brand-50 transition-all duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-100 hover:bg-brand-50 transition-all duration-300">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-100 hover:bg-brand-50 transition-all duration-300">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.path.startsWith("/#") ? (
                      <a 
                        href={link.path}
                        className="text-slate-500 hover:text-brand-600 text-[15px] font-medium transition-colors inline-flex items-center group"
                      >
                         {link.label}
                      </a>
                    ) : (
                      <Link 
                        to={link.path}
                        className="text-slate-500 hover:text-brand-600 text-[15px] font-medium transition-colors inline-flex items-center group whitespace-nowrap"
                      >
                        {link.label}
                        {link.label === "Download Deskstop Tool" && <ExternalLink size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure SSL Encrypted Conversion</span>
          </div>
          
          <div className="text-slate-400 text-sm font-medium">
             &copy; {currentYear} OSTtoPST. All rights reserved.
          </div>

          <div className="flex items-center gap-6 text-sm font-bold">
             <span className="flex items-center gap-1.5  opacity-100 hover:opacity-100 transition-all cursor-crosshair">
                Built with Privacy First
             </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
