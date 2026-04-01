import React from "react";
import Facebook from "lucide-react/dist/esm/icons/facebook";
import Twitter from "lucide-react/dist/esm/icons/twitter";
import Linkedin from "lucide-react/dist/esm/icons/linkedin";
import Instagram from "lucide-react/dist/esm/icons/instagram";
import Youtube from "lucide-react/dist/esm/icons/youtube";
import Mail from "lucide-react/dist/esm/icons/mail";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";

const Footer = () => {
  const socialLinks = [
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Twitter, label: "Twitter X", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Youtube, label: "YouTube", href: "#" },
    { icon: Mail, label: "Email", href: "mailto:support@osttopst.us" },
  ];

  return (
    <footer className="border-t border-slate-200 pt-16 pb-8 px-4 md:px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-brand-600" />
              <span className="text-xl font-bold text-slate-900 tracking-tight">OSTtoPST.us</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Professional OST to PST conversion service designed for speed, security, and accuracy. Convert your Outlook data with confidence.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-brand-100 hover:text-brand-600 transition-all duration-300 cursor-pointer group"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-4">
              <li><a href="/privacy-policy" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms-conditions" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">Terms & Conditions</a></li>
              <li><a href="/faq" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">Frequently Asked Questions</a></li>
              <li><a href="/support" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">Support Center</a></li>
            </ul>
          </div>

          {/* Blogs & Resources */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Blogs & Resources</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Check out our latest guides on Outlook data management, OST recovery, and email migration tips.
            </p>
            <a href="/blogs" className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-2">
              Read Our Blog 
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </a>
          </div>

          {/* Contact Us */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Contact Us</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Have questions? Our support team is here to help you 24/7 with any technical or billing inquiries.
            </p>
            <div className="space-y-3">
              <a href="mailto:support@osttopst.us" className="text-sm text-slate-500 hover:text-brand-600 flex items-center gap-3">
                <Mail className="w-4 h-4 opacity-50" />
                support@osttopst.us
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-400">
            Copyright © 2026 - <span className="font-semibold">OSTtoPST.us</span>. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin/blogs" className="text-[10px] text-slate-300 hover:text-slate-500 transition-colors">Internal Dashboard</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
 
export default Footer;
