import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Premium Plans", path: "/our-plans" },
    { label: "How It Works", path: "/how-it-works" },
    { label: "FAQ", path: "/#faq" },
    { label: "Support", path: "/support" },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="flex h-14 md:h-16 items-center justify-between px-4 md:px-8 border-b border-border/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div
        className="flex items-center gap-2 md:gap-3 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="p-1.5 rounded-lg bg-brand-100/50">
          <img
            src={logo}
            alt="OST to PST Converter"
            className="w-5 h-5 md:w-6 md:h-6 object-contain"
          />
        </div>
        <span className="text-sm md:text-lg font-bold tracking-tight text-slate-800">
          OST TO PST
        </span>
      </div>

      {/* Desktop Nav */}
      <nav className="hidden lg:flex items-center gap-6 lg:gap-8">
        {navItems.map((item) => (
          <span
            key={item.label}
            onClick={() => handleNavClick(item.path)}
            className="cursor-pointer text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors"
          >
            {item.label}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2 lg:gap-4">
        <Button className="hidden lg:flex bg-brand-500 hover:bg-brand-600 text-white font-bold px-5 h-9 md:h-10 text-xs md:text-sm">
          Try Desktop Version
        </Button>

        <div className="flex items-center">
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="outline"
                className="h-8 md:h-10 px-3 md:px-4 text-xs md:text-sm border-slate-300 text-slate-700 font-bold"
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
                  userButtonAvatarBox: "h-8 w-8 md:h-9 md:w-9 ring-2 ring-brand-100",
                },
              }}
            />
          </SignedIn>
        </div>

        {/* Hamburger Toggle */}
        <button
          className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="absolute top-14 md:top-16 left-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 lg:hidden">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.path)}
              className="text-left py-3 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              {item.label}
            </button>
          ))}
          <div className="h-px bg-slate-100 mx-4 my-1" />
          <Button className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-xl text-sm">
            Try Desktop Version
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
