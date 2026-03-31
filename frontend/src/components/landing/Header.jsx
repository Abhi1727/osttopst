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
    { label: "Home", path: "/" },
    { label: "Our Plan", path: "/our-plans" },
    { label: "How It Works", path: "/how-it-works" },
    { label: "Blogs", path: "/blogs" },
    { label: "FAQ", path: "/#faq" },
    { label: "Contact Us", path: "/contact" },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="flex flex-col bg-[#f0f9ff]/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 border-b border-blue-100/50 transition-all duration-300">
      {/* Top Row: Logo and Buttons */}
      <div className="flex h-14 md:h-16 items-center justify-between w-full max-w-7xl mx-auto">
        <div
          className="flex items-center gap-2 md:gap-3 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="p-1.5 rounded-lg bg-brand-100/50 group-hover:bg-brand-100 transition-colors">
            <img
              src={logo}
              alt="OST to PST Converter"
              className="w-5 h-5 md:w-6 md:h-6 object-contain"
            />
          </div>
          <span className="text-sm md:text-lg font-bold tracking-tight text-slate-800">
            OST TO PST CONVERTER
          </span>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  className="h-8 md:h-10 px-3 md:px-4 text-xs md:text-sm text-slate-800 font-bold hover:bg-slate-100"
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
                    userButtonAvatarBox:
                      "h-8 w-8 md:h-9 md:w-9 ring-2 ring-brand-100",
                  },
                }}
              />
            </SignedIn>
          </div>

          <Button
            variant="outline"
            className="hidden lg:flex h-8 md:h-9 px-3 md:px-4 text-[10px] md:text-xs font-bold border-brand-200 text-brand-600 bg-brand-50/50 rounded-full cursor-default"
          >
            Trial Expired
          </Button>

          <Button className="hidden lg:flex bg-[#f3833b] hover:bg-[#e2722b] text-white font-bold px-4 md:px-5 h-8 md:h-9 text-[10px] md:text-xs rounded-lg shadow-sm">
            Get Desktop Tool
          </Button>

          {/* Hamburger Toggle */}
          <button
            className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop Navigation: Centered Row */}
      <nav className="hidden lg:flex items-center justify-center gap-6 lg:gap-10 pb-4">
        {navItems.map((item) => (
          <span
            key={item.label}
            onClick={() => handleNavClick(item.path)}
            className={`cursor-pointer text-[15px] md:text-[17px] font-medium transition-all duration-200 hover:opacity-80 ${
              item.label === "Home"
                ? "text-brand-500 font-semibold"
                : "text-slate-700"
            }`}
          >
            {item.label}
          </span>
        ))}
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="absolute top-14 md:top-16 left-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 lg:hidden">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.path)}
              className={`text-left py-3 px-4 text-sm font-bold rounded-xl transition-colors ${
                item.label === "Home"
                  ? "bg-brand-50 text-brand-600"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="h-px bg-slate-100 mx-4 my-1" />
          <Button className="w-full bg-[#f3833b] hover:bg-[#e2722b] text-white font-bold py-6 rounded-xl text-sm">
            Get Desktop Tool
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
