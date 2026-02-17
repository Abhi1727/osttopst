import { useState, useEffect } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/clerk-react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import LandingPage from "./components/landing/LandingPage";
import FilePreview from "./components/FilePreview";
import HowItWorks from "./components/HowItWorks";
import Faq from "./components/Faq";
import Support from "./components/Support";
import Pricing from "./components/Pricing";
import UnifiedHeader from "./components/UnifiedHeader";
import Footer from "./components/landing/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import React from "react";

function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem("pst_session");
    return saved ? JSON.parse(saved) : null;
  });

  const navigate = useNavigate();

  // Ensure light theme is always applied
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    localStorage.removeItem("theme");
  }, []);

  // Persist session
  useEffect(() => {
    if (session) {
      localStorage.setItem("pst_session", JSON.stringify(session));
    } else {
      localStorage.removeItem("pst_session");
    }
  }, [session]);

  const handleUploadComplete = (data) => {
    console.log("[App] handleUploadComplete called with:", data);
    setSession(data);
    toast.success("Session ready!");
  };

  const handleReset = () => {
    console.log("[App] Resetting session...");
    setSession(null);
    localStorage.removeItem("pst_session");
    navigate("/");
  };

  const { getToken } = useAuth();
  const location = useLocation();

  // Reactive navigation to preview if session exists and we are on home
  useEffect(() => {
    if (session && location.pathname === "/") {
      console.log("[App] Session detected, navigating to preview...");
      navigate("/preview");
    }
  }, [session, location.pathname, navigate]);

  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <div
        className={`flex flex-col ${
          location.pathname === "/preview"
            ? "h-screen overflow-hidden bg-zinc-50"
            : "min-h-screen bg-white"
        }`}
      >
        <UnifiedHeader session={session} />

        <main
          className={`flex-1 flex flex-col ${
            location.pathname === "/preview" ? "overflow-hidden" : ""
          }`}
        >
          <Routes>
            <Route
              path="/"
              element={<LandingPage onUploadComplete={handleUploadComplete} />}
            />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route
              path="/preview"
              element={<FilePreview session={session} onReset={handleReset} />}
            />
            <Route path="/faq" element={<Faq />} />
            <Route path="/support" element={<Support />} />
            <Route path="/premium-plans" element={<Pricing />} />
          </Routes>
        </main>
        {location.pathname !== "/preview" && <Footer />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
