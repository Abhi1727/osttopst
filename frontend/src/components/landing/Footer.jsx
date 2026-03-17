import React from "react";
import logo from "@/assets/logo.png";
import facebookIcon from "@/assets/svg/facebook.svg";
import twitterXIcon from "@/assets/svg/twitter-x.svg";
import linkedinIcon from "@/assets/svg/linkedin.svg";
import instagramIcon from "@/assets/svg/instagram.svg";
import youtubeIcon from "@/assets/svg/youtube.svg";
import envelopeIcon from "@/assets/svg/envelope-fill.svg";

const Footer = () => {
  const socialLinks = [
    { icon: facebookIcon, label: "Facebook", href: "#" },
    { icon: twitterXIcon, label: "Twitter X", href: "#" },
    { icon: linkedinIcon, label: "LinkedIn", href: "#" },
    { icon: instagramIcon, label: "Instagram", href: "#" },
    { icon: youtubeIcon, label: "YouTube", href: "#" },
    { icon: envelopeIcon, label: "Email", href: "mailto:support@osttopst.us" },
  ];

  return (
    <footer className="border-t border-slate-200 py-8 px-4 md:px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-6">
        <div className="flex items-center gap-2 text-slate-600">
          <img src={logo} alt="Logo" className="w-4 h-4 object-contain" />
          <span className="text-sm font-semibold">
            Copyright © 2026 - <span>OSTtoPST.us</span>
          </span>
        </div>

        <div className="flex gap-8 text-sm text-slate-500 font-medium">
          <a
            href="/privacy-policy"
            className="hover:text-brand-600 transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="/terms-conditions"
            className="hover:text-brand-600 transition-colors"
          >
            Terms & Conditions
          </a>
          <a href="/faq" className="hover:text-brand-600 transition-colors">
            FAQ
          </a>
          <a
            href="/support"
            className="hover:text-brand-600 transition-colors"
          >
            Contact
          </a>
          <a
            href="/admin/blogs"
            className="text-brand-600/50 hover:text-brand-600 transition-colors font-bold"
          >
            Admin
          </a>
        </div>

        <div className="flex gap-3">
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.href}
              className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-brand-100 hover:text-brand-600 transition-all duration-300 cursor-pointer group"
              aria-label={social.label}
            >
              <img
                src={social.icon}
                alt={social.label}
                className="w-4 h-4 object-contain opacity-60 group-hover:opacity-100 transition-opacity"
              />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
