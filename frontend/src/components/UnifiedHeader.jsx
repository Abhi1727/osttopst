import React from "react";
import LicenseBadge from "@/components/LicenseBadge";
import { Button } from "@/components/ui/button";
import Menu from "lucide-react/dist/esm/icons/menu";
import Mail from "lucide-react/dist/esm/icons/mail";
import Eye from "lucide-react/dist/esm/icons/eye";
import Rocket from "lucide-react/dist/esm/icons/rocket";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Braces from "lucide-react/dist/esm/icons/braces";
import Archive from "lucide-react/dist/esm/icons/archive";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Code from "lucide-react/dist/esm/icons/code";
import FileCode from "lucide-react/dist/esm/icons/file-code";
import Table from "lucide-react/dist/esm/icons/table";
import User from "lucide-react/dist/esm/icons/user";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Image from "lucide-react/dist/esm/icons/image";

import { useNavigate, useLocation } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

import SessionGuardModal from "./SessionGuardModal";
import { useState, useEffect, useRef } from "react";

const UnifiedHeader = ({ session, onReset }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isGuardOpen, setIsGuardOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState("/");
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const productsMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productsMenuRef.current && !productsMenuRef.current.contains(event.target)) {
        setIsProductsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigation = (path) => {
    if (session && location.pathname === "/preview" && path !== "/preview") {
      setPendingPath(path);
      setIsGuardOpen(true);
    } else {
      navigate(path);
    }
  };

  const confirmLeave = () => {
    setIsGuardOpen(false);
    if (onReset) onReset();
    navigate(pendingPath);
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Products", path: "/#products" },
    { label: "Our Plan", path: "/our-plans" },
    { label: "How It Works", path: "/#how-it-works" },
    { label: "Blogs", path: "/blogs" },
    { label: "FAQ", path: "/faq" },
    { label: "Contact Us", path: "/contact-us" },
  ];

  const productsList = [
    { label: "OST Viewer Online", path: "/ost-viewer", icon: <Eye size={18} /> },
    { label: "OST Converter", path: "/", icon: <Rocket size={18} /> },
    { label: "OST to PDF", path: "/ost-to-pdf", icon: <FileText size={18} /> },
    { label: "OST to JSON", path: "/ost-to-json", icon: <Braces size={18} /> },
    { label: "OST to MBOX", path: "/ost-to-mbox", icon: <Archive size={18} /> },
    { label: "OST to EML", path: "/ost-to-eml", icon: <Mail size={18} /> },
    { label: "OST to MSG", path: "/ost-to-msg", icon: <MessageSquare size={18} /> },
    // { label: "OST to HTML", path: "/ost-to-html", icon: <Code size={18} /> },
    // { label: "OST to MHTML", path: "/ost-to-mhtml", icon: <FileCode size={18} /> },
    // { label: "OST to DOC", path: "/ost-to-doc", icon: <FileText size={18} /> },
    // { label: "OST to DOCX", path: "/ost-to-docx", icon: <FileText size={18} /> },
    // { label: "OST to TXT", path: "/ost-to-txt", icon: <FileText size={18} /> },
    // { label: "OST to RTF", path: "/ost-to-rtf", icon: <FileText size={18} /> },
    // { label: "OST to CSV", path: "/ost-to-csv", icon: <Table size={18} /> },
    // { label: "OST to XML", path: "/ost-to-xml", icon: <Code size={18} /> },
    // { label: "OST to VCF", path: "/ost-to-vcf", icon: <User size={18} /> },
    // { label: "OST to ICS", path: "/ost-to-ics", icon: <Calendar size={18} /> },
    // { label: "OST to XPS", path: "/ost-to-xps", icon: <FileText size={18} /> },
    // { label: "OST to TIFF", path: "/ost-to-tiff", icon: <Image size={18} /> },
  ];


  const handleNavItemClick = (item) => {
    setIsProductsMenuOpen(false);
    if (item.label === "How It Works" && location.pathname === "/") {
      const el = document.getElementById("how-it-works");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    handleNavigation(item.path);
  };


  const isViewerActive = location.pathname === "/ost-viewer";
  const isConverterActive = !isViewerActive;

  return (
    <header className="flex h-16 md:h-18 items-center justify-between px-4 md:px-6 lg:px-8 xl:px-14 bg-white fixed top-0 left-0 right-0 z-50 gap-2 shadow-sm border-b border-slate-100">
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="flex items-center gap-2 md:gap-3 cursor-pointer"
          onClick={() => handleNavigation("/")}
        >
          <div className="flex items-center justify-center p-1 rounded-md bg-[#0078d4]">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm md:text-lg font-medium tracking-tight text-slate-700 whitespace-nowrap">
            OST to PST Converter
          </span>
        </div>

        {/* Module Switcher */}
        <div className="hidden md:flex items-center gap-1 ml-2 bg-slate-100 rounded-full p-1">
          <button
            onClick={() => handleNavigation("/")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
              isConverterActive
                ? "bg-white text-brand-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Rocket size={11} />
            Converter
          </button>
          <button
            onClick={() => handleNavigation("/ost-viewer")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
              isViewerActive
                ? "bg-white text-violet-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Eye size={11} />
            Viewer
          </button>
        </div>
      </div>

      {/* Desktop Nav - Centered */}
      <nav className="hidden lg:flex flex-1 justify-center items-center gap-4 xl:gap-8 mx-2 relative z-[60]">
        {navItems.map((item) => {
          if (item.label === "Products") {
            return (
              <div key={item.label} className="relative group/nav-item" ref={productsMenuRef}>
                <span
                  onClick={() => setIsProductsMenuOpen(!isProductsMenuOpen)}
                  className={`cursor-pointer inline-flex items-center gap-1 text-sm xl:text-base font-medium transition-colors whitespace-nowrap py-6 ${isProductsMenuOpen ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {item.label}
                  <ChevronDown size={14} className={`text-brand-500 transition-transform ${isProductsMenuOpen ? 'rotate-180' : ''}`} />
                </span>
                
                {/* Dropdown Popover */}
                <div className={`absolute top-16 left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 z-[100] ${isProductsMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-2'}`}>
                  <div className="bg-white rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden w-[900px] p-5 flex flex-col">
                    <div className="px-4 py-2 mb-3 border-b border-slate-50 flex items-center justify-between">
                       <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em]">Universal Conversion Suite</span>
                       <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{productsList.length} Tools Available</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {productsList.map((prod) => (
                        <span
                          key={prod.label}
                          onClick={() => {
                            setIsProductsMenuOpen(false);
                            handleNavigation(prod.path);
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-500 hover:text-white cursor-pointer transition-all group/prod hover:shadow-lg hover:shadow-brand-500/20 active:scale-95"
                        >
                          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-50 text-brand-500 group-hover/prod:bg-white/20 group-hover/prod:text-white transition-colors shrink-0 outline outline-1 outline-brand-100 group-hover/prod:outline-transparent shadow-sm">
                            {prod.icon}
                          </div>
                          <span className="text-sm font-semibold text-slate-700 group-hover/prod:text-white transition-colors truncate">
                            {prod.label}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          const isActive =
            item.path === "/"
              ? location.pathname === "/" && !location.hash
              : item.path.startsWith("/#")
                ? location.hash === item.path.substring(1)
                : location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <span
              key={item.label}
              onClick={() => handleNavItemClick(item)}
              className={`cursor-pointer text-sm xl:text-base font-medium transition-colors whitespace-nowrap py-6 ${
                isActive
                  ? "text-brand-500"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.label}
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 md:gap-4 lg:border-l border-slate-100 lg:pl-4 shrink-0 relative z-[60]">
        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="h-8 px-3 xl:px-4 text-xs border border-slate-900 text-slate-900 font-bold rounded-full hover:bg-slate-50 transition-all font-sans whitespace-nowrap">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <Button className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-3 xl:px-5 h-8 rounded-full shadow-lg shadow-brand-500/10 transition-all border-none text-[10px] whitespace-nowrap">
            Get Desktop Tool
          </Button>

          <SignedIn>
            <div className="flex items-center gap-3 ml-2">
              <LicenseBadge />
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8 ring-2 ring-slate-100",
                  },
                }}
              />
            </div>
          </SignedIn>
        </div>

        {/* Mobile menu trigger */}
        <div className="lg:hidden flex items-center gap-2 relative z-[60]">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-600"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] flex flex-col gap-6 pt-10 bg-white overflow-y-auto"
            >
              <SheetTitle className="text-left text-brand-500 font-bold text-xl px-4">
                Menu
              </SheetTitle>

              {/* Mobile Module Switcher */}
              <div className="flex items-center gap-1 mx-4 bg-slate-100 rounded-full p-1 shrink-0">
                <SheetClose asChild>
                  <button
                    onClick={() => handleNavigation("/")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                      isConverterActive
                        ? "bg-white text-brand-600 shadow-sm"
                        : "text-slate-400"
                    }`}
                  >
                    <Rocket size={11} />
                    Converter
                  </button>
                </SheetClose>
                <SheetClose asChild>
                  <button
                    onClick={() => handleNavigation("/ost-viewer")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                      isViewerActive
                        ? "bg-white text-violet-600 shadow-sm"
                        : "text-slate-400"
                    }`}
                  >
                    <Eye size={11} />
                    Viewer
                  </button>
                </SheetClose>
              </div>

              <div className="flex flex-col gap-1 px-2 pb-8">
                {navItems.map((item) => {
                  if (item.label === "Products") {
                    return (
                      <div key={item.label} className="flex flex-col gap-1 mt-2 mb-2">
                        <span className="text-left py-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-6">
                          Products
                        </span>
                        {productsList.map((prod) => (
                          <SheetClose key={prod.label} asChild>
                            <button
                              onClick={() => handleNavigation(prod.path)}
                              className="flex items-center gap-3 py-3 px-6 text-sm font-semibold rounded-xl transition-colors text-slate-700 hover:bg-brand-500 hover:text-white group"
                            >
                              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-50 text-brand-500 outline outline-1 outline-brand-100 group-hover:bg-white/20 group-hover:text-white group-hover:outline-transparent transition-colors shrink-0">
                                {React.cloneElement(prod.icon, { size: 14 })}
                              </div>
                              {prod.label}
                            </button>
                          </SheetClose>
                        ))}
                        <div className="h-px bg-slate-100 mx-4 my-2"></div>
                      </div>
                    );
                  }

                  return (
                    <SheetClose key={item.label} asChild>
                      <button
                        onClick={() => handleNavItemClick(item)}
                        className={`text-left py-3 px-4 text-base font-medium rounded-xl transition-colors ${
                          location.pathname === "/" && item.path === "/"
                            ? !location.hash
                            : item.path.startsWith("/#")
                              ? location.hash === item.path.substring(1)
                              : location.pathname === item.path ||
                                (item.path !== "/" &&
                                  location.pathname.startsWith(item.path))
                            ? "bg-brand-50 text-brand-500"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    </SheetClose>
                  );
                })}
              </div>

              <div className="mt-auto pb-8 flex flex-col gap-3 px-6 shrink-0 border-t border-slate-100 pt-6">
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button
                      variant="outline"
                      className="w-full h-11 text-sm font-bold border-slate-900 rounded-full"
                    >
                      Sign In
                    </Button>
                  </SignInButton>
                </SignedOut>

                <Button className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-full text-sm border-none shadow-lg shadow-brand-500/20">
                  Get Desktop Tool
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <SessionGuardModal
        isOpen={isGuardOpen}
        onClose={() => setIsGuardOpen(false)}
        onHome={confirmLeave}
        onExport={() => setIsGuardOpen(false)}
      />
    </header>
  );
};

export default UnifiedHeader;

