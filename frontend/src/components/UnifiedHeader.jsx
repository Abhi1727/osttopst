import React from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Sparkles, Menu, X } from "lucide-react";
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

  return (
    <header className="flex h-20 items-center justify-between px-6 lg:px-12 border-b border-border/10 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => handleNavigation("/")}
      >
        <div className="p-2 rounded-lg bg-emerald-100/50">
          <img
            src={logo}
            alt="OST to PST Converter"
            className="w-6 h-6 object-contain"
          />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800">
          OST TO PST Converter
        </span>
      </div>

      <nav className="hidden lg:flex items-center gap-8">
        {["Home", "Our Plan", "How It Works", "FAQ", "Blogs", "Contact Us"].map(
          (item) => {
            let path = "/";
            if (item === "Home") path = "/";
            if (item === "Our Plan") path = "/our-plans";
            if (item === "How It Works") path = "/#how-it-works";
            if (item === "FAQ") path = "/faq";
            if (item === "Blogs") path = "/blogs";
            if (item === "Contact Us") path = "/support";

            const isActive = location.pathname === path;

            return (
              <span
                key={item}
                onClick={() => {
                  if (item === "How It Works" && location.pathname === "/") {
                    const el = document.getElementById("how-it-works");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                      return;
                    }
                  }
                  handleNavigation(path);
                }}
                className={`cursor-pointer text-sm font-medium transition-colors ${
                  isActive
                    ? "text-emerald-600 font-bold"
                    : "text-slate-600 hover:text-emerald-600"
                }`}
              >
                {item}
              </span>
            );
          },
        )}
      </nav>

      <div className="flex items-center gap-4">
        <Button className="hidden xl:flex bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-6 shadow-md shadow-amber-400/20 gap-2">
          <Sparkles className="w-4 h-4" />
          Try Desktop Version
        </Button>

        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-600">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] flex flex-col gap-8 pt-12"
            >
              <SheetTitle className="text-left text-emerald-600 font-bold">
                Menu
              </SheetTitle>
              <nav className="flex flex-col gap-6">
                {[
                  "Home",
                  "Our Plan",
                  "How It Works",
                  "FAQ",
                  "Blogs",
                  "Contact Us",
                ].map((item) => {
                  let path = "/";
                  if (item === "Home") path = "/";
                  if (item === "Our Plan") path = "/our-plans";
                  if (item === "How It Works") path = "/#how-it-works";
                  if (item === "FAQ") path = "/faq";
                  if (item === "Blogs") path = "/blogs";
                  if (item === "Contact Us") path = "/support";

                  return (
                    <SheetClose key={item} asChild>
                      <span
                        onClick={() => {
                          if (
                            item === "How It Works" &&
                            location.pathname === "/"
                          ) {
                            const el = document.getElementById("how-it-works");
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth" });
                              return;
                            }
                          }
                          handleNavigation(path);
                        }}
                        className={`text-lg font-semibold cursor-pointer ${
                          location.pathname === path
                            ? "text-emerald-600"
                            : "text-slate-600"
                        }`}
                      >
                        {item}
                      </span>
                    </SheetClose>
                  );
                })}
              </nav>
              <Separator />
              <Button className="w-full bg-amber-400 text-slate-900 font-bold">
                Get Desktop Version
              </Button>
            </SheetContent>
          </Sheet>
        </div>

        <LicenseBadge />

        <SignedOut>
          <SignInButton mode="modal">
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700 hover:text-emerald-600 hover:border-emerald-600"
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
                userButtonAvatarBox: "h-9 w-9 ring-2 ring-emerald-100",
              },
            }}
          />
        </SignedIn>
      </div>
      <SessionGuardModal
        isOpen={isGuardOpen}
        onClose={() => setIsGuardOpen(false)}
        onHome={confirmLeave}
        onExport={() => {
          setIsGuardOpen(false);
          // Ideally trigger export dialog which is in FilePreview...
          // But Header doesn't control FilePreview state.
          // Maybe navigate to preview with strict "open export" param?
          // Or just close intended modal and let user export manually.
          // For now, close modal. User stays on preview.
        }}
      />
    </header>
  );
};

export default UnifiedHeader;
