import React from "react";
import { Github, Twitter } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-slate-600">
          <img src={logo} alt="Logo" className="w-4 h-4 object-contain" />
          <span className="text-sm font-semibold">© 2026 OSTPST Converter</span>
        </div>

        <div className="flex gap-8 text-sm text-slate-500 font-medium">
          <a href="#" className="hover:text-emerald-600 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-emerald-600 transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-emerald-600 transition-colors">
            Contact
          </a>
        </div>

        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors cursor-pointer">
            <Twitter className="w-4 h-4" />
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors cursor-pointer">
            <Github className="w-4 h-4" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
