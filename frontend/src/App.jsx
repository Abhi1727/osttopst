import { useState, useEffect, lazy, Suspense } from "react";
import { SignedIn } from "@clerk/clerk-react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import LandingPage from "./components/landing/LandingPage";
import UnifiedHeader from "./components/UnifiedHeader";
import Footer from "./components/landing/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import React from "react";
import { deleteSession } from "./services/api";

// Lazy-load all non-critical routes — they are only loaded when navigated to
const FilePreview = lazy(() => import("./components/FilePreview"));
const Faq = lazy(() => import("./components/Faq"));
const Support = lazy(() => import("./components/Support"));
const Blogs = lazy(() => import("./components/Blogs"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const BlogPostDetail = lazy(() => import("./components/BlogPostDetail"));
const Pricing = lazy(() => import("./components/Pricing"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./components/TermsConditions"));

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
    setSession(data);
  };

  const handleReset = () => {
    setSession(null);
    localStorage.removeItem("pst_session");
    navigate("/");
  };

  const handleRestore = (recoveredSession) => {
    setSession(recoveredSession);
    navigate("/preview");
  };

  const navigationType = useNavigationType();
  const location = useLocation();

  // Scroll to top on route change, unless it's a browser Back/Forward (POP)
  useEffect(() => {
    if (!location.hash && navigationType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash, navigationType]);

  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      {location.pathname !== "/preview" && (
        <UnifiedHeader session={session} onReset={handleReset} />
      )}
      <div
        className={`flex flex-col professional-gradient ${
          location.pathname === "/preview"
            ? "h-screen overflow-hidden bg-[#1a1a1a]"
            : "min-h-screen pt-14 md:pt-16"
        }`}
      >
        <main
          className={`flex-1 flex flex-col ${
            location.pathname === "/preview" ? "h-full overflow-hidden" : ""
          }`}
        >
          <Suspense fallback={null}>
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
              
              <Route
                path="/preview"
                element={<FilePreview session={session} onReset={handleReset} />}
              />
              <Route path="/faq" element={<Faq />} />
              <Route path="/support" element={<Support />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route
                path="/admin/blogs"
                element={
                  <SignedIn>
                    <AdminDashboard />
                  </SignedIn>
                }
              />
              <Route path="/blogs/:slug" element={<BlogPostDetail />} />
              <Route path="/our-plans" element={<Pricing />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
            </Routes>
          </Suspense>
        </main>
        {location.pathname !== "/preview" && <Footer />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
