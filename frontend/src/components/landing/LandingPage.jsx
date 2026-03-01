import React from "react";
import Hero from "./Hero";
import Features from "./Features";
import Glossary from "./Glossary";
import ConversionMissions from "./ConversionMissions";
import TechnicalAdvantages from "./TechnicalAdvantages";
import ReviewSection from "./ReviewSection";
import ConversionHistory from "../ConversionHistory";
import HowItWorks from "./HowItWorks";
import TrustFeatures from "./TrustFeatures";
import { SignedIn } from "@clerk/clerk-react";

const LandingPage = ({ onUploadComplete, onRestore }) => {
  return (
    <div className="font-sans">
      <Hero onUploadComplete={onUploadComplete} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SignedIn>
          <ConversionHistory onRestore={onRestore} />
        </SignedIn>
      </div>

      <HowItWorks />
      <TrustFeatures />
      <Features />
      <TechnicalAdvantages />
      <Glossary />
      <ConversionMissions />
      <ReviewSection />
    </div>
  );
};

export default LandingPage;
