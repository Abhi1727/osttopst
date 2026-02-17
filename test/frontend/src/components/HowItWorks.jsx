import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  Cpu,
  Download,
  ArrowRight,
  HelpCircle,
  FileText,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { useNavigate } from "react-router-dom";

const HowItWorks = () => {
  const [steps, setSteps] = useState([
    {
      stepNumber: 1,
      title: "Upload & Securely Transfer",
      description:
        "Drag and drop your .ost file (up to 50GB) into our 256-bit SSL encrypted pipeline. We ensure a safe transfer, avoiding risks associated with unverified consumer software.",
      iconName: "UploadCloud",
    },
    {
      stepNumber: 2,
      title: "Intelligent Processing",
      description:
        "Our engine analyzes the OST, repairs header errors from 'dirty shutdowns', and eliminates duplicate emails. We maintain your original folder hierarchy and metadata integrity.",
      iconName: "Cpu",
    },
    {
      stepNumber: 3,
      title: "Instant PST Access",
      description:
        "Download your standalone PST file immediately. Once converted, the data is independent of the server and ready for use in any Outlook version. Files are automatically deleted after 24 hours.",
      iconName: "Download",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/howitswork")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("API not ready");
      })
      .then((data) => {
        setSteps(data);
      })
      .catch((err) => {
        console.log("Using default steps (API offline or unreachable)");
      });
  }, []);

  const getIcon = (iconName) => {
    switch (iconName) {
      case "UploadCloud":
        return <UploadCloud className="w-8 h-8 text-white" />;
      case "Cpu":
        return <Cpu className="w-8 h-8 text-white" />;
      case "Download":
        return <Download className="w-8 h-8 text-slate-900" />;
      default:
        return null;
    }
  };

  const getBgIcon = (iconName) => {
    switch (iconName) {
      case "UploadCloud":
        return <FileUpIcon className="w-32 h-32 text-slate-100" />;
      case "Cpu":
        return <Cpu className="w-32 h-32 text-slate-100" />;
      case "Download":
        return <ShieldCheck className="w-32 h-32 text-slate-100" />; // Utilizing a ShieldIcon for security implication or checkmark
      default:
        return null;
    }
  };

  // Custom ShieldCheck Icon for the background
  const ShieldCheck = ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );

  // Custom FileUp Icon for the background
  const FileUpIcon = ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M12 12v6" />
      <path d="m9 15 3-3 3 3" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-emerald-50/50 to-slate-50 pt-20 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">
          Process Guide
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
          How It Works
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base">
          A simple 3-step process to recover and convert your Outlook data with
          enterprise-grade security.
        </p>
      </div>

      {/* Steps Section */}
      <div className="max-w-4xl mx-auto px-4 w-full flex-1 pb-24 space-y-6">
        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start gap-8 relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            {/* Background Icon */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-50 pointer-events-none">
              {index === 0 && (
                <FileUpIcon className="w-40 h-40 text-slate-100" />
              )}
              {index === 1 && <Cpu className="w-40 h-40 text-slate-100" />}
              {index === 2 && (
                <ShieldCheck className="w-40 h-40 text-slate-100" />
              )}
            </div>

            {/* Icon Box */}
            <div
              className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                index === 2
                  ? "bg-amber-400 shadow-amber-400/20"
                  : "bg-emerald-600 shadow-emerald-600/20"
              }`}
            >
              {getIcon(step.iconName)}
            </div>

            <div className="flex-1 relative z-10">
              <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider block mb-2">
                Step 0{step.stepNumber}
              </span>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">
                {step.title}
              </h3>
              {/* Applying specific formatting to parts of the description if needed, logic to match screenshots bold text */}
              <p className="text-slate-500 leading-relaxed text-sm md:text-base">
                {step.description.split(" ").map((word, i) => {
                  // Highlight logic (simple heuristic based on keywords or just render plain for now)
                  // The screenshot shows specific bolding: "50GB", "folder structure", "automatically deleted after 24 hours"
                  const boldWords = [
                    "50GB,",
                    "50GB",
                    "folder",
                    "structure,",
                    "structure",
                    "metadata,",
                    "automatically",
                    "deleted",
                    "after",
                    "24",
                    "hours",
                  ];
                  if (boldWords.includes(word)) {
                    if (word === "automatically" && step.stepNumber === 3)
                      return (
                        <span key={i} className="font-bold text-emerald-600">
                          {word}{" "}
                        </span>
                      );
                    if (word === "deleted" && step.stepNumber === 3)
                      return (
                        <span key={i} className="font-bold text-emerald-600">
                          {word}{" "}
                        </span>
                      );
                    if (word === "after" && step.stepNumber === 3)
                      return (
                        <span key={i} className="font-bold text-emerald-600">
                          {word}{" "}
                        </span>
                      );
                    if (word === "24" && step.stepNumber === 3)
                      return (
                        <span key={i} className="font-bold text-emerald-600">
                          {word}{" "}
                        </span>
                      );
                    if (word === "hours" && step.stepNumber === 3)
                      return (
                        <span key={i} className="font-bold text-emerald-600">
                          {word}{" "}
                        </span>
                      );

                    return (
                      <span key={i} className="font-bold text-slate-800">
                        {word}{" "}
                      </span>
                    );
                  }
                  return word + " ";
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="bg-slate-800 py-20 px-4 relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-1/2 left-10 -translate-y-1/2 w-48 h-48 rounded-full border border-slate-700/50"></div>
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-64 h-64 rounded-full border border-slate-700/50"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to start?
          </h2>
          <p className="text-slate-400 mb-10 max-w-lg mx-auto">
            Experience the fastest and most secure way to convert your Outlook
            data files online.
          </p>
          <div className="flex gap-4">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-8 rounded-md flex items-center gap-2"
              onClick={() => navigate("/")}
            >
              <Zap className="w-4 h-4 fill-white" />
              Convert Now
            </Button>
            <Button
              variant="outline"
              className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700 hover:text-white font-bold h-12 px-8 rounded-md flex items-center gap-2"
              onClick={() => navigate("/support")}
            >
              <HelpCircle className="w-4 h-4" />
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
