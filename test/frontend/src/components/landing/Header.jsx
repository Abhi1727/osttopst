import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import logo from "@/assets/logo.png";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="flex h-20 items-center justify-between px-6 lg:px-12 border-b border-border/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="p-2 rounded-lg bg-emerald-100/50">
          <img
            src={logo}
            alt="OST to PST Converter"
            className="w-6 h-6 object-contain"
          />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800">
          OSTPST Converter
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        {["Premium Plans", "How It Works", "FAQ", "Support"].map((item) => (
          <span
            key={item}
            onClick={() => {
              if (item === "Premium Plans") navigate("/premium-plans");
              if (item === "How It Works") navigate("/how-it-works");
              if (item === "Support") navigate("/support");
            }}
            className={`cursor-pointer text-sm font-medium transition-colors ${
              item === "Premium Plans" ||
              item === "How It Works" ||
              item === "Support"
                ? "text-slate-900 font-semibold hover:text-emerald-600"
                : "text-slate-600 hover:text-emerald-600"
            }`}
          >
            {item}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <Button className="hidden lg:flex bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-6 shadow-md shadow-amber-400/20">
          Try Desktop Version
        </Button>

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
    </header>
  );
};

export default Header;
