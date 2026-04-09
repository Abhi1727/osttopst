import React from "react";
import { useLocation } from "react-router-dom";
import { UploadCloud, RefreshCw, Download, Play } from "lucide-react";

const IconStepCard = ({ number, title, description, icon: Icon }) => (
  <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col items-center text-center space-y-4 w-full h-full">
    <div className="text-slate-500 font-medium text-lg">
      {number === 3 ? "Step 3" : `Step ${number}`}
    </div>
    <div className="text-[#0EA5E9]">
      <Icon className="w-10 h-10 md:w-12 md:h-12 stroke-[1.5]" />
    </div>
    <div className="space-y-2">
      <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">
        {title}
      </h3>
      <p className="text-slate-500 font-normal leading-relaxed text-sm max-w-[200px]">
        {description}
      </p>
    </div>
  </div>  
);

const DetailStepCard = ({ number, title, description }) => (
  <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl md:rounded-[2rem] border border-slate-200/50 shadow-sm flex flex-col items-center text-center space-y-4 md:space-y-5 h-full">
    <div className="text-slate-800 text-xl md:text-2xl font-normal opacity-80">
      {number}
    </div>
    <div className="space-y-2 md:space-y-3">
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">
        {title}
      </h3>
      <p className="text-slate-600 font-normal leading-relaxed text-sm md:text-base max-w-[400px]">
        {description}
      </p>
    </div>
  </div>
);

const HowItWorks = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (location.hash === "#how-it-works") {
      const el = document.getElementById("how-it-works");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
  }, [location.hash]);

  return (
    <section
      id="how-it-works"
      className="bg-[#f0f9ff] py-24 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* UPPER SECTION: 3 Steps + Video */}
        <div className="mb-16 md:mb-24">
          <div className="text-center mb-10 md:mb-12">
            <h2 className=" text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              How to Convert<span className="text-brand-600"> OST to PST</span>{" "}
              File?
            </h2>
          </div>

          <div className="mb-12 md:mb-16 flex justify-center">
            <div className="bg-black w-full max-w-4xl aspect-video md:aspect-[21/9] rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center gap-4 md:gap-6 cursor-pointer hover:scale-[1.01] transition-all duration-300 shadow-xl group p-4 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-2 sm:border-4 border-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Play className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white fill-white ml-1 md:ml-2" />
              </div>
              <h3 className="text-white text-2xl sm:text-3xl md:text-5xl font-medium tracking-tight">
                Watch Tutorial
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 justify-center gap-6 lg:gap-8 max-w-6xl mx-auto">
            <IconStepCard
              number={1}
              title="Select the OST File"
              icon={UploadCloud}
            />
            <IconStepCard
              number={2}
              title="Upload the OST File"
              icon={RefreshCw}
            />
            <IconStepCard
              number={3}
              title="Download PST File"
              icon={Download}
            />
          </div>
        </div>

        {/* LOWER SECTION: 4 Detailed Steps */}
        <div className="border-t border-slate-200/50 pt-16 md:pt-24">
          <div className="text-center mb-12 md:mb-16 space-y-4 px-2">
            <p className="text-slate-600 text-base md:text-lg font-medium max-w-3xl mx-auto leading-relaxed">
              The process of converting from OST to PST is simple, even if you
              do not have a technical background. This service is designed for
              the average computer user.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
            <DetailStepCard
              number={1}
              title="Upload Your OST File"
              description={
                <>
                  Simply drag and drop your file or click{" "}
                  <strong>Browse</strong> to find the file on your computer. We
                  currently support files up to 5 GB in size in our Professional
                  Plan.
                </>
              }
            />
            <DetailStepCard
              number={2}
              title="Automatic Conversion Begins"
              description="When your .ost file is uploaded, it instantly begins the conversion process(your file will first be repaired if the ost file is corrupt) and then will be converted to a PST file."
            />
            <DetailStepCard
              number={3}
              title="Preview & Your PST File"
              description="When finished, you can preview what you have converted and then download your PST file directly to your computer."
            />
            <DetailStepCard
              number={4}
              title="Import into Outlook"
              description="To use any edition of Microsoft Outlook to open PST, do file Menu Open & Export Import/Export. Once the PST is opened the emails, calendar appointments and contacts will be available from within it."
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
