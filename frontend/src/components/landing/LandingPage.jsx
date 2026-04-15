import React, { lazy, Suspense } from "react";
import Hero from "./Hero";
import { SignedIn } from "@clerk/clerk-react";

// Lazy-load components to reduce initial JS execution and improve LCP
const FormatMarquee = lazy(() => import("./FormatMarquee"));
const ConversionHistory = lazy(() => import("../ConversionHistory"));

// Lazy-load components below the fold for better performance
const Glossary = lazy(() => import("./Glossary"));
const ConversionMissions = lazy(() => import("./ConversionMissions"));
const TechnicalAdvantages = lazy(() => import("./TechnicalAdvantages"));
const ReviewSection = lazy(() => import("./ReviewSection"));
const HowItWorks = lazy(() => import("./HowItWorks"));
const TrustFeatures = lazy(() => import("./TrustFeatures"));
const LandingFaq = lazy(() => import("./LandingFaq"));

const LandingPage = ({ onUploadComplete, onRestore }) => {
  return (
    <div className="font-sans">
      {/* First Screen Wrapper - Hero & History Block */}
      <div className="flex flex-col bg-brand-50 relative">
        <div>
          <Hero onUploadComplete={onUploadComplete} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-2 z-10">
          <SignedIn>
            <Suspense fallback={<div className="h-20" />}>
              <ConversionHistory onRestore={onRestore} />
            </Suspense>
          </SignedIn>
        </div>
      </div>

      <div className="relative z-[0]">
        <Suspense fallback={<div className="h-40" />}>
          <FormatMarquee />
        </Suspense>
      </div>
      <Suspense fallback={<div className="h-10" />}>
        <HowItWorks />
      </Suspense>
      <Suspense fallback={<div className="h-10" />}>
        <TrustFeatures />
      </Suspense>
      <Suspense fallback={<div className="h-10" />}>
        <TechnicalAdvantages />
      </Suspense>
      <Suspense fallback={<div className="h-10" />}>
        <Glossary />
      </Suspense>
      <Suspense fallback={<div className="h-10" />}>
        <ConversionMissions />
      </Suspense>
      <Suspense fallback={<div className="h-10" />}>
        <LandingFaq />
      </Suspense>
      <Suspense fallback={<div className="h-10" />}>
        <ReviewSection />
      </Suspense>
    </div>
  );
};

export default LandingPage;
