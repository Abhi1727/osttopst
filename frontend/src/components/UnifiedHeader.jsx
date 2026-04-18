import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Menu from "lucide-react/dist/esm/icons/menu";
import Mail from "lucide-react/dist/esm/icons/mail";
import Eye from "lucide-react/dist/esm/icons/eye";
import Rocket from "lucide-react/dist/esm/icons/rocket";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";

const LicenseBadge = lazy(() => import("@/components/LicenseBadge"));
const SessionGuardModal = lazy(() => import("./SessionGuardModal"));
const MobileNav = lazy(() => import("./landing/MobileNav"));

import { useNavigate, useLocation } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";

import { ADMIN_EMAILS } from "@/config/admin";
import { toast } from "sonner";

const UnifiedHeader = ({ session, onReset }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [isGuardOpen, setIsGuardOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState("/");
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("converter");
  const productsMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        productsMenuRef.current &&
        !productsMenuRef.current.contains(event.target)
      ) {
        setIsProductsMenuOpen(false);
        setActiveCategory("converter");
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
    { label: "Pricing", path: "/our-plans" },
    { label: "How It Works", path: "/#how-it-works" },
    { label: "Blogs", path: "/blogs" },
    { label: "FAQ", path: "/faq" },
    { label: "Contact Us", path: "/contact-us" },
  ];

  const productsList = [
    { bullet: "•", label: "OST Viewer Online", path: "/ost-viewer" },
    { bullet: "•", label: "OST Converter", path: "/" },
    { bullet: "•", label: "OST to PDF", path: "/ost-to-pdf" },
    { bullet: "•", label: "OST to JSON", path: "/ost-to-json" },
    { bullet: "•", label: "OST to MBOX", path: "/ost-to-mbox" },
    { bullet: "•", label: "OST to EML", path: "/ost-to-eml" },
    { bullet: "•", label: "OST to MSG", path: "/ost-to-msg" },
  ];

  const megaMenuProducts = [
    {
      label: "OST Converter",
      path: "/",
      desc: "Convert OST files to multiple formats with one powerful tool",
      icon: (
        <>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </>
      ),
    },
    {
      label: "OST to PDF",
      path: "/ost-to-pdf",
      desc: "Export OST emails and attachments to PDF documents",
      icon: (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="15" y2="17" />
        </>
      ),
    },
    {
      label: "OST to JSON",
      path: "/ost-to-json",
      desc: "Transform OST data to JSON format for data processing",
      icon: (
        <>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </>
      ),
    },
    {
      label: "OST to MBOX",
      path: "/ost-to-mbox",
      desc: "Migrate OST files to MBOX format for cross-platform email clients",
      icon: (
        <>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </>
      ),
    },
    {
      label: "OST to EML",
      path: "/ost-to-eml",
      desc: "Extract individual emails from OST to EML file format",
      icon: (
        <>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </>
      ),
    },
    {
      label: "OST to MSG",
      path: "/ost-to-msg",
      desc: "Save OST messages in MSG format for Outlook compatibility",
      icon: (
        <>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="M22 6l-10 7L2 6" />
          <line x1="12" y1="13" x2="12" y2="13" />
        </>
      ),
    },
  ];

  const viewerProducts = [
    {
      label: "OST Viewer Online",
      path: "/ost-viewer",
      desc: "View and read OST files online without Microsoft Outlook",
      icon: (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        </>
      ),
    },
  ];

  const othersProducts = [
    {
      label: "Coming Soon",
      path: null,
      desc: "Additional tools for password recovery and OST file management",
      icon: (
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </>
      ),
    },
  ];

  const supportedPlatforms = [
    {
      label: "Microsoft 365",
      icon: (
        <>
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </>
      ),
    },
    {
      label: "Outlook Desktop",
      icon: (
        <>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </>
      ),
    },
    {
      label: "Exchange Server",
      icon: (
        <>
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6" y2="6" />
          <line x1="6" y1="18" x2="6" y2="18" />
        </>
      ),
    },
    {
      label: "Office 365",
      icon: (
        <>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </>
      ),
    },
    {
      label: "IMAP Servers",
      icon: (
        <>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </>
      ),
    },
    {
      label: "Gmail",
      icon: (
        <>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="M22 7l-10 7L2 7" />
        </>
      ),
    },
    {
      label: "Yahoo Mail",
      icon: (
        <>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="M2 6l10 7 10-7" />
        </>
      ),
    },
    {
      label: "All OST Files",
      icon: (
        <>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </>
      ),
    },
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
    <header className="flex h-16 items-center justify-between px-3 sm:px-4 md:px-6 lg:px-6 xl:px-14 bg-white fixed top-0 left-0 right-0 z-50 gap-2 shadow-sm border-b border-slate-100">
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        <div
          className="flex items-center gap-2 md:gap-3 cursor-pointer min-w-0"
          onClick={() => handleNavigation("/")}
        >
          <div className="flex items-center justify-center p-1 rounded-md bg-[#0078d4] shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm md:text-lg font-medium tracking-tight text-slate-700 whitespace-nowrap truncate max-w-[140px] sm:max-w-none">
            OSTTOPST.US
          </span>
        </div>

        {/* Module Switcher */}
        <div className="hidden 2xl:flex items-center gap-1 ml-2 bg-slate-100 rounded-full p-1 shrink-0 max-w-full">
          <button
            onClick={() => handleNavigation("/")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
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
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              isViewerActive
                ? "bg-white text-brand-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Eye size={11} />
            Viewer
          </button>
        </div>
      </div>

      {/* Desktop Nav - Centered */}
      <nav className="hidden lg:flex flex-1 justify-center items-center gap-2 xl:gap-3 2xl:gap-6 mx-1 xl:mx-2 relative z-[60] min-w-0">
        {navItems.map((item) => {
          if (item.label === "Products") {
            return (
              <div
                key={item.label}
                className="relative group/nav-item"
                ref={productsMenuRef}
              >
                <span
                  onClick={() => setIsProductsMenuOpen(!isProductsMenuOpen)}
                  className={`cursor-pointer inline-flex items-center gap-1 text-xs 2xl:text-sm font-medium transition-colors whitespace-nowrap py-6 ${
                    isProductsMenuOpen
                      ? "text-brand-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                  <ChevronDown
                    size={14}
                    className={`text-brand-500 transition-transform ${
                      isProductsMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </span>

                {/* 3-Column Mega Menu Dropdown */}
                <div
                  className={`fixed top-16 left-0 right-0 px-6 transition-all duration-200 z-[100] flex justify-center ${
                    isProductsMenuOpen
                      ? "opacity-100 pointer-events-auto translate-y-0"
                      : "opacity-0 pointer-events-none -translate-y-2"
                  }`}
                >
                  <div className="bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.22)] border border-slate-100 overflow-hidden w-full max-w-[1100px] flex">
                    {/* ── Left: Category Tabs ── */}
                    <div className="w-[260px] shrink-0 border-r border-slate-100 bg-slate-50/60 p-4 flex flex-col gap-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-2 px-3">
                        Categories
                      </p>

                      {/* OST Converter */}
                      <button
                        onClick={() => setActiveCategory("converter")}
                        className={`w-full text-left px-4 py-4 rounded-xl transition-all group ${
                          activeCategory === "converter"
                            ? "bg-white shadow-sm border border-brand-100"
                            : "hover:bg-white hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[14px] font-bold transition-colors ${
                              activeCategory === "converter"
                                ? "text-brand-600"
                                : "text-slate-700 group-hover:text-brand-600"
                            }`}
                          >
                            OST Converter
                          </span>
                          <ChevronRight
                            size={15}
                            className={`transition-all ${
                              activeCategory === "converter"
                                ? "text-brand-400"
                                : "text-slate-300 group-hover:text-brand-400"
                            }`}
                          />
                        </div>
                        <p className="text-[12px] text-slate-500 leading-snug">
                          Convert OST to PST, PDF, JSON, MBOX, EML &amp; MSG
                        </p>
                      </button>

                      {/* Viewer */}
                      <button
                        onClick={() => setActiveCategory("viewer")}
                        className={`w-full text-left px-4 py-4 rounded-xl transition-all group ${
                          activeCategory === "viewer"
                            ? "bg-white shadow-sm border border-brand-100"
                            : "hover:bg-white hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[14px] font-bold transition-colors ${
                              activeCategory === "viewer"
                                ? "text-brand-600"
                                : "text-slate-700 group-hover:text-brand-600"
                            }`}
                          >
                            OST Viewer
                          </span>
                          <ChevronRight
                            size={15}
                            className={`transition-all ${
                              activeCategory === "viewer"
                                ? "text-brand-400"
                                : "text-slate-300 group-hover:text-brand-400"
                            }`}
                          />
                        </div>
                        <p className="text-[12px] text-slate-500 leading-snug">
                          Read OST files online without Microsoft Outlook
                        </p>
                      </button>

                      {/* Others */}
                      <button
                        onClick={() => setActiveCategory("others")}
                        className={`w-full text-left px-4 py-4 rounded-xl transition-all group ${
                          activeCategory === "others"
                            ? "bg-white shadow-sm border border-brand-100"
                            : "hover:bg-white hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[14px] font-bold transition-colors ${
                              activeCategory === "others"
                                ? "text-brand-600"
                                : "text-slate-700 group-hover:text-brand-600"
                            }`}
                          >
                            Other Tools
                          </span>
                          <ChevronRight
                            size={15}
                            className={`transition-all ${
                              activeCategory === "others"
                                ? "text-brand-400"
                                : "text-slate-300 group-hover:text-brand-400"
                            }`}
                          />
                        </div>
                        <p className="text-[12px] text-slate-500 leading-snug">
                          Additional tools for OST file management
                        </p>
                      </button>
                    </div>

                    {/* ── Middle: Products Grid ── */}
                    <div className="flex-1 p-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-4 px-1">
                        Products
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(activeCategory === "converter"
                          ? megaMenuProducts
                          : activeCategory === "viewer"
                            ? viewerProducts
                            : othersProducts
                        ).map((prod) => (
                          <button
                            key={prod.label}
                            onClick={() => {
                              if (!prod.path) return;
                              setIsProductsMenuOpen(false);
                              handleNavigation(prod.path);
                            }}
                            className={`flex items-start gap-4 px-4 py-4 rounded-xl transition-all text-left group ${
                              prod.path
                                ? "hover:bg-slate-50 hover:shadow-sm cursor-pointer"
                                : "cursor-default opacity-60"
                            }`}
                          >
                            <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#0ea5e9"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-6 h-6"
                              >
                                {prod.icon}
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[14px] font-bold text-slate-800 group-hover:text-brand-600 transition-colors leading-tight">
                                {prod.label}
                              </p>
                              <p className="text-[12px] text-slate-400 mt-1 leading-snug line-clamp-2">
                                {prod.desc}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Right: What We Support ── */}
                    <div className="w-[220px] shrink-0 border-l border-slate-100 bg-slate-50/40 p-5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-4">
                        What We Support
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {supportedPlatforms.map((platform) => (
                          <div
                            key={platform.label}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-default"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#0ea5e9"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4 shrink-0"
                            >
                              {platform.icon}
                            </svg>
                            <span className="text-[13px] text-slate-700 font-medium">
                              {platform.label}
                            </span>
                          </div>
                        ))}
                      </div>
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
                  (item.path !== "/" &&
                    location.pathname.startsWith(item.path));

          return (
            <span
              key={item.label}
              onClick={() => handleNavItemClick(item)}
              className={`cursor-pointer text-xs 2xl:text-sm font-medium transition-colors whitespace-nowrap py-6 ${
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

      <div className="flex items-center gap-1 lg:gap-2 lg:border-l border-slate-100 lg:pl-3 shrink-0 relative z-[60] min-w-0">
        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center gap-1.5 2xl:gap-2 shrink-0">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="h-7 px-2.5 2xl:px-4 text-[10px] 2xl:text-xs border border-slate-900 text-slate-900 font-bold rounded-full hover:bg-slate-50 transition-all font-sans whitespace-nowrap">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <Button
            onClick={() => toast("Coming soon!")}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-2.5 2xl:px-5 h-7 2xl:h-8 rounded-full shadow-lg shadow-brand-500/10 transition-all border-none text-[10px] whitespace-nowrap"
          >
            Get Desktop Tool
          </Button>

          <SignedIn>
            <div className="flex items-center gap-1.5 2xl:gap-3 ml-1 2xl:ml-2 shrink-0">
              {user?.primaryEmailAddress?.emailAddress &&
                ADMIN_EMAILS.includes(
                  user.primaryEmailAddress.emailAddress,
                ) && (
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation("/admin/blogs")}
                    className="h-7 px-2 text-[10px] font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-full flex items-center gap-1 whitespace-nowrap"
                  >
                    Dashboard
                  </Button>
                )}
              <span className="hidden 2xl:inline-flex">
                <Suspense fallback={null}>
                  <LicenseBadge />
                </Suspense>
              </span>
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

        <Suspense fallback={null}>
          <MobileNav
            isConverterActive={isConverterActive}
            isViewerActive={isViewerActive}
            navItems={navItems}
            productsList={productsList}
            handleNavigation={handleNavigation}
            handleNavItemClick={handleNavItemClick}
            location={location}
            user={user}
            ADMIN_EMAILS={ADMIN_EMAILS}
          />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <SessionGuardModal
          isOpen={isGuardOpen}
          onClose={() => setIsGuardOpen(false)}
          onHome={confirmLeave}
          onExport={() => setIsGuardOpen(false)}
        />
      </Suspense>
    </header>
  );
};

export default UnifiedHeader;
