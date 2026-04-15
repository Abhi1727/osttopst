import React from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Rocket from "lucide-react/dist/esm/icons/rocket";
import Eye from "lucide-react/dist/esm/icons/eye";
import Menu from "lucide-react/dist/esm/icons/menu";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { ADMIN_EMAILS } from "@/config/admin";

const MobileNav = ({
  isConverterActive,
  isViewerActive,
  navItems,
  productsList,
  handleNavigation,
  handleNavItemClick,
  location,
  user,
}) => {
  return (
    <div className="lg:hidden flex items-center gap-1 sm:gap-2 relative z-[60] shrink-0">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-600 shrink-0"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[280px] max-w-[90vw] flex flex-col gap-6 pt-10 bg-white overflow-y-auto"
        >
          <SheetTitle className="text-left text-brand-500 font-bold text-xl px-4">
            Menu
          </SheetTitle>

          {/* Mobile Module Switcher */}
          <div className="flex items-center gap-1 mx-4 bg-slate-100 rounded-full p-1 shrink-0">
            <SheetClose asChild>
              <button
                onClick={() => handleNavigation("/")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
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
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  isViewerActive
                    ? "bg-white text-brand-600 shadow-sm"
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
                  <div
                    key={item.label}
                    className="flex flex-col gap-1 mt-2 mb-2"
                  >
                    <span className="text-left py-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-6">
                      Products
                    </span>
                    {productsList.map((prod) => (
                      <SheetClose key={prod.label} asChild>
                        <button
                          onClick={() => handleNavigation(prod.path)}
                          className="flex items-center gap-3 py-3.5 px-6 text-sm font-bold rounded-xl transition-all text-slate-700 hover:bg-brand-500 hover:text-white group w-full text-left active:scale-95"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 group-hover:bg-white transition-colors shrink-0" />
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
                    className={`text-left py-3 px-4 text-base font-medium rounded-xl transition-colors w-full ${
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
            <SignedIn>
              {user?.primaryEmailAddress?.emailAddress &&
                ADMIN_EMAILS.includes(user.primaryEmailAddress.emailAddress) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleNavigation("/admin/blogs");
                    }}
                    className="w-full h-11 text-sm font-bold border-brand-500 text-brand-600 rounded-full mb-2"
                  >
                    Admin Dashboard
                  </Button>
                )}
            </SignedIn>

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
  );
};

export default MobileNav;
