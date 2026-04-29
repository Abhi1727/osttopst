import { useState, useEffect, lazy, Suspense } from "react";
import { SignedIn, useUser } from "@clerk/clerk-react";
import { ADMIN_EMAILS } from "@/config/admin";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useNavigationType,
  Navigate,
} from "react-router-dom";
const UnifiedHeader = lazy(() => import("./components/UnifiedHeader"));
const Footer = lazy(() => import("./components/landing/Footer"));
const LandingPage = lazy(() => import("./components/landing/LandingPage"));
import ErrorBoundary from "./components/ErrorBoundary";
import SchemaMarkup from "./components/SchemaMarkup";
import { Toaster } from "@/components/ui/sonner";
//import { toast } from "sonner";
import React from "react";
//import { deleteSession } from "./services/api";

// Lazy-load all non-critical routes — they are only loaded when navigated to
const FilePreview = lazy(() => import("./components/FilePreview"));
const Faq = lazy(() => import("./components/Faq"));
const ContactUs = lazy(() => import("./components/ContactUs"));
const Blogs = lazy(() => import("./components/Blogs"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const BlogPostDetail = lazy(() => import("./components/BlogPostDetail"));
const OstToPstDesktop = lazy(() => import("./components/landing/OstToPstDesktop"));

// Admin Guard Component
const AdminGuard = ({ children }) => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null; // Wait for user to load

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
    return <Navigate to="/" replace />;
  }

  return children;
};
const Pricing = lazy(() => import("./components/Pricing"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./components/TermsConditions"));
const OstViewer = lazy(() => import("./components/OstViewer"));
const RefundPolicy = lazy(() => import("./components/RefundPolicy"));

function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem("pst_session");
    return saved ? JSON.parse(saved) : null;
  });

  const navigate = useNavigate();

  // Ensure light theme is always applied.
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

  // Handle Canonical Tags
  useEffect(() => {
    const baseUrl = "https://www.osttopst.us";
    let path = location.pathname;

    // Remove trailing slash if any (except for root)
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }

    // Skip blog posts since BlogPostDetail.jsx manages its own canonical tag
    if (path.startsWith("/blogs/") && path !== "/blogs") {
      return;
    }

    const canonicalUrl = `${baseUrl}${path}`;

    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <SchemaMarkup />
      <Toaster position="top-right" />
      {!["/preview"].includes(location.pathname) && (
        <Suspense
          fallback={
            <div className="h-16 md:h-[72px] w-full bg-white border-b border-slate-50" />
          }
        >
          <UnifiedHeader session={session} onReset={handleReset} />
        </Suspense>
      )}
      <div
        className={`flex flex-col professional-gradient ${
          location.pathname === "/preview"
            ? "h-screen overflow-hidden bg-[#1a1a1a]"
            : "min-h-screen pt-16"
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
                element={
                  <FilePreview session={session} onReset={handleReset} />
                }
              />
              <Route path="/faq" element={<Faq />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route
                path="/support"
                element={<Navigate to="/contact-us" replace />}
              />
              <Route path="/blogs" element={<Blogs />} />
              <Route
                path="/admin/blogs"
                element={
                  <SignedIn>
                    <AdminGuard>
                      <AdminDashboard />
                    </AdminGuard>
                  </SignedIn>
                }
              />
              <Route path="/blogs/:slug" element={<BlogPostDetail />} />
              <Route path="/our-plans" element={<Pricing />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route
                path="/ost-to-pdf"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-json"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-mbox"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-eml"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-msg"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-html"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-mhtml"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-doc"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-docx"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-txt"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-rtf"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-csv"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-xml"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-vcf"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-ics"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-xps"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route
                path="/ost-to-tiff"
                element={
                  <LandingPage
                    onUploadComplete={handleUploadComplete}
                    onRestore={handleRestore}
                  />
                }
              />
              <Route path="/ost-viewer" element={<OstViewer />} />
              <Route path="/ost-to-pst-desktop" element={<OstToPstDesktop />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
            </Routes>
          </Suspense>
        </main>
        {!["/preview"].includes(location.pathname) && (
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
