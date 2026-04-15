import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Menu from "lucide-react/dist/esm/icons/menu";
import Mail from "lucide-react/dist/esm/icons/mail";
import Eye from "lucide-react/dist/esm/icons/eye";
import Rocket from "lucide-react/dist/esm/icons/rocket";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";

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

const UnifiedHeader = ({ session, onReset }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [isGuardOpen, setIsGuardOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState("/");
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const productsMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        productsMenuRef.current &&
        !productsMenuRef.current.contains(event.target)
      ) {
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

                {/* Dropdown Popover */}
                <div
                  className={`absolute top-16 left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 z-[100] ${
                    isProductsMenuOpen
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none translate-y-2"
                  }`}
                >
                  <div className="bg-white rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden w-[calc(100vw-1rem)] max-w-[900px] p-4 sm:p-5 flex flex-col">
                    <div className="px-4 py-2 mb-3 border-b border-slate-50 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] whitespace-nowrap">
                        Universal Conversion Suite
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {productsList.length} Tools Available
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {productsList.map((prod) => (
                        <span
                          key={prod.label}
                          onClick={() => {
                            setIsProductsMenuOpen(false);
                            handleNavigation(prod.path);
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-500 hover:text-white cursor-pointer transition-all group/prod hover:shadow-lg hover:shadow-brand-500/20 active:scale-95 min-w-0"
                        >
                          <span className="text-sm font-semibold text-slate-700 group-hover/prod:text-white transition-colors truncate min-w-0">
                            {prod.bullet} {prod.label}
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

          <Button className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-2.5 2xl:px-5 h-7 2xl:h-8 rounded-full shadow-lg shadow-brand-500/10 transition-all border-none text-[10px] whitespace-nowrap">
            Get Desktop Tool
          </Button>

          <SignedIn>
            <div className="flex items-center gap-1.5 2xl:gap-3 ml-1 2xl:ml-2 shrink-0">
              {user?.primaryEmailAddress?.emailAddress &&
                ADMIN_EMAILS.includes(user.primaryEmailAddress.emailAddress) && (
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