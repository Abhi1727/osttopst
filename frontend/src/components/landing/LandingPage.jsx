import React from "react";
import Hero from "./Hero";
import Glossary from "./Glossary";
import ConversionMissions from "./ConversionMissions";
import TechnicalAdvantages from "./TechnicalAdvantages";
import ReviewSection from "./ReviewSection";
import ConversionHistory from "../ConversionHistory";
import HowItWorks from "./HowItWorks";
import TrustFeatures from "./TrustFeatures";
import LandingFaq from "./LandingFaq";
import FormatMarquee from "./FormatMarquee";

import { SignedIn } from "@clerk/clerk-react";

const LandingPage = ({ onUploadComplete, onRestore }) => {
  return (
    <div className="font-sans">
      {/* First Screen Wrapper */}
      <div className="min-h-[calc(100vh-76px)] flex flex-col bg-[#f0f9ff]/50 relative overflow-hidden">
        <div className="flex-1 flex flex-col justify-center">
          <Hero onUploadComplete={onUploadComplete} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8 z-10">
          <SignedIn>
            <ConversionHistory onRestore={onRestore} />
          </SignedIn>
        </div>
      </div>

      <FormatMarquee />

      <HowItWorks />
      <TrustFeatures />
      <TechnicalAdvantages />
      <Glossary />
      <ConversionMissions />
      <LandingFaq />
      <ReviewSection />
    </div>
  );
};

export default LandingPage;
