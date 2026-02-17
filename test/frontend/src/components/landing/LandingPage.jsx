import React from "react";
import Hero from "./Hero";
import Features from "./Features";
import Glossary from "./Glossary";
import ConversionMissions from "./ConversionMissions";
import TechnicalAdvantages from "./TechnicalAdvantages";
import ReviewSection from "./ReviewSection";

const LandingPage = ({ onUploadComplete }) => {
  return (
    <div className="font-sans">
      <Hero onUploadComplete={onUploadComplete} />
      <Features />
      <Glossary />
      <ConversionMissions />
      <TechnicalAdvantages />
      <ReviewSection />
    </div>
  );
};

export default LandingPage;
