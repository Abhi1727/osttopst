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
import Blogs from "./components/Blogs";
import AdminDashboard from "./components/AdminDashboard";
import BlogPostDetail from "./components/BlogPostDetail";
import Pricing from "./components/Pricing";
import UnifiedHeader from "./components/UnifiedHeader";
import Footer from "./components/landing/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import React from "react";
import { deleteSession } from "./services/api";

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
    navigate("/preview");
  };

  const handleReset = () => {
    console.log(
      "[App] Clearing local session state (preserving backend history)...",
    );
    setSession(null);
    localStorage.removeItem("pst_session");
    navigate("/");
  };

  const handleRestore = (recoveredSession) => {
    console.log("[App] Restoring session:", recoveredSession);
    setSession(recoveredSession);
    navigate("/preview");
  };

  const { getToken } = useAuth();
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  // No automatic redirection - allow user to see landing page/history
  // even if a session is in localStorage. Navigation to /preview happens
  // explicitly via handleUploadComplete or handleRestore.

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
        <UnifiedHeader session={session} onReset={handleReset} />

        <main
          className={`flex-1 flex flex-col ${
            location.pathname === "/preview" ? "overflow-hidden" : ""
          }`}
        >
          <Routes>
            <Route
              path="/"
              element={
                <LandingPage
                  onUploadComplete={handleUploadComplete}
                  onRestore={handleRestore}
                />
              }
            />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route
              path="/preview"
              element={<FilePreview session={session} onReset={handleReset} />}
            />
            <Route path="/faq" element={<Faq />} />
            <Route path="/support" element={<Support />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/admin/blogs" element={<AdminDashboard />} />
            <Route path="/blogs/:id" element={<BlogPostDetail />} />
            <Route path="/our-plans" element={<Pricing />} />
          </Routes>
        </main>
        {location.pathname !== "/preview" && <Footer />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
