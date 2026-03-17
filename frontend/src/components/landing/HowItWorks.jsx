import React from "react";
import { useLocation } from "react-router-dom";
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
  FileCode,
} from "lucide-react";

const Step = ({ number, title, description, icon: Icon }) => (
  <div className="flex flex-col items-center text-center max-w-sm mx-auto group">
    <div className="w-16 h-16 md:w-24 md:h-24 bg-brand-50 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-8 relative group-hover:bg-brand-500 group-hover:text-white transition-all group-hover:-translate-y-1">
      <Icon className="w-8 h-8 md:w-12 md:h-12 text-brand-600 group-hover:text-white" />
      <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-8 md:h-8 bg-brand-600 text-white rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-base font-black shadow-lg">
        {number}
      </div>
    </div>
    <h3 className="text-lg md:text-2xl font-black text-slate-900 mb-2 md:mb-4 tracking-tight">
      {title}
    </h3>
    <p className="text-slate-500 font-semibold leading-relaxed text-xs md:text-base">
      {description}
    </p>
  </div>
);

const HowItWorks = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (location.hash === "#how-it-works") {
      const el = document.getElementById("how-it-works");
      if (el) {
        // Longer timeout to ensure layout is stable
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
  }, [location.hash]);

  return (
    <section
      id="how-it-works"
      className="py-12 md:py-20 overflow-hidden scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-16 space-y-1">
         <h1 className="text-xl md:text-3xl font-bold font-sans">Convert <span className="text-brand-600">OST Files To PST</span> in Just</h1>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
            <span className="text-brand-600">3 Simple Steps</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 lg:gap-20 relative">
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-brand-100 -z-10"></div>
          <Step
            number={1}
            title="Upload OST File"
            description="Drag and drop your file or click Browse to select your OST locally."
            icon={UploadCloud}
          />
          <Step
            number={2}
            title="Processing & Conversion"
            description="Our advanced engine automatically repairs and converts your file to PST."
            icon={RefreshCw}
          />
          <Step
            number={3}
            title="Download Result"
            description="Preview your converted folders and download the final PST instantly."
            icon={Download}
          />
        </div>

        {/* Video Tutorial Section */}
        <div className="mt-8 md:mt-16 flex justify-center">
          <div className="relative group w-full max-w-xs md:max-w-lg aspect-square bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex items-center justify-center border-4 md:border-[12px] border-slate-50">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/30 via-transparent to-transparent opacity-60"></div>

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
              <div className="w-24 h-24 md:w-32 md:h-32 bg-brand-600 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(14,165,233,0.4)] group-hover:scale-110 transition-all duration-500 cursor-pointer">
                <Play className="w-10 h-10 md:w-12 md:h-12 text-white fill-current ml-1" />
              </div>
              <div className="text-center px-8">
                <h4 className="text-white font-bold text-2xl md:text-3xl mb-3">
                  Watch Tutorial
                </h4>
                <p className="text-brand-100/70 text-base max-w-sm mx-auto font-medium leading-relaxed">
                  See how easy it is to convert your OST files in just 2 minutes with our intuitive interface.
                </p>
              </div>
            </div>

            {/* Video Controls Decor */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer ">
              <div className="h-1.5 bg-white/20 rounded-full flex-grow mx-4 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-brand-500"></div>
              </div>
              <div className="text-white/80 text-sm font-mono tracking-wider">02:45</div>
            </div>
          </div>
        </div>

        {/* Conversion Steps Section */}
        <div className="mt-16 md:mt-20 space-y-8 md:space-y-12">
          <div className="text-center space-y-2">
            <p className="text-slate-500 max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
              The process of converting from OST to PST is simple even if you do
              not have a technical background. This service is designed for the
              average computer user.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center space-y-5">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center">
                Upload Your OST File
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm text-center">
                Simply drag and drop your file or click "Browse" to find the
                file on your computer. We currently support files up to 50 GB in
                size.
              </p>
            </div>
            {/* Step 2 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center space-y-5">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center">
                Automatic-Conversion Begins
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm text-center">
                When your .ost file is uploaded it instantly begins the
                conversion process (your file will first be repaired if it is
                corrupt) and then will be converted to a PST file.
              </p>
            </div>
            {/* Step 3 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center space-y-5">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center">
                Preview & Your PST File
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm text-center">
                When finished you can preview what you have converted and then
                download your PST file directly to your computer.
              </p>
            </div>
            {/* Step 4 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center space-y-5">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg">
                4
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center">
                Import into Outlook
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm text-center">
                To use any edition of Microsoft Outlook to open PST, do File
                Menu → Open & Export → Import/Export. Once the PST is opened,
                the emails, calendar appointments, and contacts will be
                available from within it.
              </p>
            </div>
          </div>
        </div>

        {/* Glossary Section */}
        <div className="mt-16 md:mt-20 space-y-8 md:space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900">
              Understanding{" "}
              <span className="text-brand-600">OST and PST</span>
            </h2>
            <p className="text-slate-500 max-w-3xl mx-auto text-lg leading-relaxed">
              A quick guide to Outlook's primary data storage formats.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* PST Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-2xl">
                  <FileCode className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  PST (Personal Storage Table)
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  A PST file is also called an{" "}
                  <strong>"Outlook Data File,"</strong> which is simply an
                  archived version of the email messages, as well as
                  appointments, contacts, and to-dos that could be saved onto
                  one's computer independently from any email server account (it
                  can be created as needed).
                </p>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">
                      Purpose:
                    </strong>{" "}
                    Stores emails and other data as a personal archive.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">
                      Server:
                    </strong>{" "}
                    Not linked to the server account.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">
                      Adaptability:
                    </strong>{" "}
                    Can be smoothly shifted and opened on another system.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">
                      Usage:
                    </strong>{" "}
                    Utilized for backup, storage, as well as for the migration.
                  </p>
                </div>
              </div>
            </div>

            {/* OST Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-50 rounded-2xl">
                  <RefreshCw className="w-8 h-8 text-brand-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  OST (Offline Storage Table)
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  An OST file is known as an{" "}
                  <strong>"Offline Outlook Data File."</strong> This type of
                  file allows you to work even when you are not connected to the
                  Internet. It will also allow you to use the system while
                  offline and then later sync any changes back to the server.
                </p>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">
                      Purpose:
                    </strong>{" "}
                    Stores the synced copy of mailbox data for the usage of offline.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">
                      Server:
                    </strong>{" "}
                    It is connected to an Exchange, Office 365, or IMAP account.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">
                      Adaptability:
                    </strong>{" "}
                    Cannot be smoothly shifted to another desktop or profile.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">
                      Usage:
                    </strong>{" "}
                    Utilized for temporary offline availability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
