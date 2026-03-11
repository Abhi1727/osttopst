import React from "react";
import {
  UploadCloud,
  RefreshCw,
  Download,
  FileText,
  Plus,
  ArrowRight,
  Shield,
  FolderTree,
  Play,
} from "lucide-react";

const StepIcon = ({ icon: Icon, badgeIcon: BadgeIcon, badgeColor }) => (
  <div className="relative">
    {/* File shape background */}
    <div className="w-24 h-28 md:w-32 md:h-36 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-8 h-8 bg-slate-50 border-l border-b border-slate-100 rounded-bl-xl"></div>
      <FileText className="w-12 h-12 md:w-16 md:h-16 text-slate-200" />

      {/* Decorative lines inside file */}
      <div className="absolute inset-x-4 bottom-8 space-y-1.5 opacity-20">
        <div className="h-1 bg-slate-400 rounded-full w-3/4"></div>
        <div className="h-1 bg-slate-400 rounded-full w-1/2"></div>
        <div className="h-1 bg-slate-400 rounded-full w-2/3"></div>
      </div>
    </div>

    {/* Overlapping badge icon */}
    <div
      className={`absolute -bottom-2 -right-2 w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg ${badgeColor} flex items-center justify-center border-4 border-white z-20`}
    >
      <BadgeIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
    </div>

    {/* Faint background icon */}
    <div className="absolute -left-6 top-4 -z-10 opacity-[0.03]">
      <Icon className="w-20 h-20 md:w-28 md:h-28 text-slate-900" />
    </div>
  </div>
);

const Step = ({
  number,
  title,
  icon,
  badgeIcon,
  badgeColor,
  showLine = true,
}) => (
  <div className="flex flex-col items-center relative group min-w-[200px]">
    <div className="relative mb-8">
      <StepIcon icon={icon} badgeIcon={badgeIcon} badgeColor={badgeColor} />

      {/* Connecting Line (Desktop) */}
      {showLine && (
        <div className="hidden md:block absolute top-1/2 -right-24 lg:-right-32 w-16 lg:w-24 border-t-2 border-dotted border-slate-200 -z-10"></div>
      )}
    </div>

    <div className="flex items-center gap-3">
      <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
        Step {number}
      </span>
      <h3 className="text-slate-800 font-bold text-sm md:text-base whitespace-nowrap">
        {title}
      </h3>
    </div>
  </div>
);

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="py-20 bg-white overflow-hidden scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Convert OST Files to PST in{" "}
            <span className="text-emerald-600">3 Simple Steps</span>
          </h2>
        </div>

        {/* Top 3 Step Graphics */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-16 md:gap-8 lg:gap-12 pl-4">
          <Step
            number={1}
            title="Upload OST File"
            icon={UploadCloud}
            badgeIcon={Plus}
            badgeColor="bg-emerald-600"
          />
          <Step
            number={2}
            title="Convert To PST"
            icon={RefreshCw}
            badgeIcon={RefreshCw}
            badgeColor="bg-emerald-600"
          />
          <Step
            number={3}
            title="Download PST File"
            icon={Download}
            badgeIcon={Download}
            badgeColor="bg-emerald-600"
            showLine={false}  
          />
        </div>

        {/* Video Tutorial Section */}
        <div className="mt-24 flex justify-center">
          <div className="relative group w-full max-w-lg aspect-square bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex items-center justify-center border-[12px] border-slate-50">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 via-transparent to-transparent opacity-60"></div>

            {/* Abstract Background Pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            ></div>

            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-emerald-600 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-all duration-500 cursor-pointer">
                <Play className="w-10 h-10 md:w-12 md:h-12 text-white fill-current ml-1" />
              </div>
              <div className="text-center px-8">
                <h4 className="text-white font-bold text-2xl md:text-3xl mb-3">
                  Watch Tutorial
                </h4>
                <p className="text-emerald-100/70 text-base max-w-sm mx-auto font-medium leading-relaxed">
                  See how easy it is to convert your OST files in just 2 minutes with our intuitive interface.
                </p>
              </div>
            </div>

            {/* Video Controls Decor */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer ">
              <div className="h-1.5 bg-white/20 rounded-full flex-grow mx-4 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-emerald-500"></div>
              </div>
              <div className="text-white/80 text-sm font-mono tracking-wider">02:45</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
