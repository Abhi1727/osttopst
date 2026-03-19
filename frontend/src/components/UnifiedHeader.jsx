import React from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Sparkles, Menu, X, Laptop } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

import SessionGuardModal from "./SessionGuardModal";
import LicenseBadge from "./LicenseBadge";
import logo from "@/assets/logo.png";
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
    { label: "FAQ", path: "/faq" },
    { label: "Blogs", path: "/blogs" },
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
    <header className="flex h-14 md:h-16 items-center justify-between px-4 md:px-8 lg:px-12 border-b border-slate-200 bg-white fixed top-0 left-0 right-0 z-50 shadow-sm transition-all duration-300">
      <div
        className="flex items-center gap-2 md:gap-3 cursor-pointer shrink-0"
        onClick={() => handleNavigation("/")}
      >
        <div className="p-1.5 rounded-lg bg-brand-100/50">
          <img
            src={logo}
            alt="OST to PST"
            className="w-5 h-5 md:w-6 md:h-6 object-contain"
          />
        </div>
        <span className="text-sm md:text-lg font-bold tracking-tight text-slate-800 whitespace-nowrap">
          OST TO PST <span className="hidden sm:inline">Converter</span>
        </span>
      </div>

      {/* Desktop Nav */}
      <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <span
              key={item.label}
              onClick={() => handleNavItemClick(item)}
              className={`cursor-pointer text-sm font-medium transition-colors ${
                isActive
                  ? "text-brand-600"
                  : "text-slate-600 hover:text-brand-600"
              }`}
            >
              {item.label}
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Only show on desktop-ish */}
        <div className="hidden lg:flex items-center gap-4">
          <Button className="hidden xl:flex bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-6 h-10 rounded-full shadow-lg shadow-orange-500/10 gap-2 transition-all border-none text-xs">
            <Laptop className="w-4 h-4" />
            Get Desktop Tool
          </Button>
          
          <LicenseBadge />

          <div className="flex items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  variant="outline"
                  className="h-9 px-4 text-xs border-slate-300 text-slate-700 font-medium"
                >
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8 ring-2 ring-brand-100",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>

        {/* Mobile menu trigger */}
        <div className="lg:hidden flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] flex flex-col gap-6 pt-10"
            >
              <SheetTitle className="text-left text-brand-600 font-semibold text-lg">
                Navigation
              </SheetTitle>
              
              <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <SheetClose key={item.label} asChild>
                    <button
                      onClick={() => handleNavItemClick(item)}
                      className={`text-left py-3 px-4 text-sm font-medium rounded-xl transition-colors ${
                        location.pathname === item.path
                          ? "bg-brand-50 text-brand-600"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  </SheetClose>
                ))}
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <div className="px-4">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 mb-3 tracking-widest">Account & License</p>
                  <LicenseBadge />
                </div>
                
                <div className="flex items-center px-4 justify-between">
                   <span className="text-sm font-medium text-slate-600">User Profile</span>
                   <SignedIn>
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          userButtonAvatarBox: "h-10 w-10 ring-2 ring-brand-100",
                        },
                      }}
                    />
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="outline" className="h-9 px-4 text-xs font-medium border-slate-300">
                        Sign In
                      </Button>
                    </SignInButton>
                  </SignedOut>
                </div>
              </div>

              <div className="mt-auto pb-4">
                <Button className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold py-6 rounded-xl flex gap-2 shadow-xl shadow-orange-500/10 border-none">
                  <Laptop className="w-5 h-5" />
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
