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
      {/* First Screen Wrapper */}
      <div className="min-h-[calc(100vh-76px)] flex flex-col bg-[#f0f9ff]/50 relative">
        <div className="flex-1 flex flex-col justify-center">
          <Hero onUploadComplete={onUploadComplete} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8 z-10 min-h-[100px]">
          <SignedIn>
            <ConversionHistory onRestore={onRestore} />
          </SignedIn>
        </div>
      </div>

      <Suspense fallback={<div className="h-40" />}>
        <div className="relative z-[0] -mt-8 sm:-mt-10 mb-8">
          <FormatMarquee />
        </div>
      </Suspense>
      <Suspense fallback={<div className="h-40" />}>
        <HowItWorks />
      </Suspense>
      <Suspense fallback={<div className="h-40" />}>
        <TrustFeatures />
      </Suspense>
      <Suspense fallback={<div className="h-40" />}>
        <TechnicalAdvantages />
      </Suspense>
      <Suspense fallback={<div className="h-40" />}>
        <Glossary />
      </Suspense>
      <Suspense fallback={<div className="h-40" />}>
        <ConversionMissions />
      </Suspense>
      <Suspense fallback={<div className="h-32" />}>
        <LandingFaq />
      </Suspense>
      <Suspense fallback={<div className="h-40" />}>
        <ReviewSection />
      </Suspense>
    </div>
  );
};

export default LandingPage;
