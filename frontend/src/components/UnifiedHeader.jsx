import React from "react";
import LicenseBadge from "@/components/LicenseBadge";
import { Button } from "@/components/ui/button";
import { Menu, Mail } from "lucide-react";
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
import { useState } from "react";

const UnifiedHeader = ({ session, onReset }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isGuardOpen, setIsGuardOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState("/");

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
    { label: "Our Plan", path: "/our-plans" },
    { label: "How It Works", path: "/#how-it-works" },
    { label: "Blogs", path: "/blogs" },
    { label: "FAQ", path: "/faq" },
    { label: "Contact Us", path: "/support" },
  ];

  const handleNavItemClick = (item) => {
    if (item.label === "How It Works" && location.pathname === "/") {
      const el = document.getElementById("how-it-works");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    handleNavigation(item.path);
  };

  return (
    <header className="flex h-16 md:h-18 items-center justify-between px-4 md:px-6 lg:px-8 xl:px-14 bg-white fixed top-0 left-0 right-0 z-50 gap-2">
      <div
        className="flex items-center gap-2 md:gap-3 cursor-pointer shrink-0"
        onClick={() => handleNavigation("/")}
      >
        <div className="flex items-center justify-center p-1 rounded-md bg-[#0078d4]">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm md:text-lg font-medium tracking-tight text-slate-700 whitespace-nowrap">
          OST to PST Converter
        </span>
      </div>

      {/* Desktop Nav - Centered */}
      <nav className="hidden lg:flex flex-1 justify-center items-center gap-4 xl:gap-8 mx-2">
        {navItems.map((item) => {
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
              className={`cursor-pointer text-sm xl:text-base font-medium transition-colors whitespace-nowrap ${
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

      <div className="flex items-center gap-2 md:gap-4 lg:border-l border-slate-100 lg:pl-4 shrink-0">
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
                afterSignOutUrl="/"
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
        <div className="lg:hidden flex items-center gap-2">
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
              className="w-[280px] flex flex-col gap-6 pt-10 bg-white"
            >
              <SheetTitle className="text-left text-brand-500 font-bold text-xl px-4">
                Menu
              </SheetTitle>

              <div className="flex flex-col gap-1 px-2">
                {navItems.map((item) => (
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
                ))}
              </div>

              <div className="mt-auto pb-8 flex flex-col gap-3 px-6">
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

                <Button className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-full text-sm border-none">
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
