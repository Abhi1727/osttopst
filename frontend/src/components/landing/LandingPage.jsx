import React, { lazy, Suspense } from "react";
import Hero from "./Hero";
import { SignedIn } from "@clerk/clerk-react";

// Lazy-load components below the fold for better LCP
const FormatMarquee = lazy(() => import("./FormatMarquee"));
const Glossary = lazy(() => import("./Glossary"));
const ConversionMissions = lazy(() => import("./ConversionMissions"));
const TechnicalAdvantages = lazy(() => import("./TechnicalAdvantages"));
const ReviewSection = lazy(() => import("./ReviewSection"));
const ConversionHistory = lazy(() => import("../ConversionHistory"));
const HowItWorks = lazy(() => import("./HowItWorks"));
const TrustFeatures = lazy(() => import("./TrustFeatures"));
const LandingFaq = lazy(() => import("./LandingFaq"));

const LandingPage = ({ onUploadComplete, onRestore }) => {
  return (
    <div className="font-sans">
      {/* First Screen Wrapper - Hero & History Block */}
      <div className="flex flex-col bg-[#f0f9ff]/60 relative border-b border-brand-100/50">
        <div>
          <Hero onUploadComplete={onUploadComplete} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-10 z-10">
          <SignedIn>
            <ConversionHistory onRestore={onRestore} />
          </SignedIn>
        </div>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <div className="relative z-[0]">
          <FormatMarquee />
        </div>
      </Suspense>
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
