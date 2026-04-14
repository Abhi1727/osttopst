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
  <div className="bg-white p-5 md:p-6 rounded-[1.5rem] border border-slate-200/50 shadow-sm flex flex-col items-center text-center space-y-3 h-full">
    <div className="text-slate-800 text-xl md:text-2xl font-normal opacity-80">
      Step {number}
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

  const formatMap = {
    "/ost-to-pdf": "PDF",
    "/ost-to-json": "JSON",
    "/ost-to-mbox": "MBOX",
    "/ost-to-eml": "EML",
    "/ost-to-msg": "MSG",
    "/ost-to-html": "HTML",
    "/ost-to-mhtml": "MHTML",
    "/ost-to-doc": "DOC",
    "/ost-to-docx": "DOCX",
    "/ost-to-txt": "TXT",
    "/ost-to-rtf": "RTF",
    "/ost-to-csv": "CSV",
    "/ost-to-xml": "XML",
    "/ost-to-vcf": "VCF",
    "/ost-to-ics": "ICS",
    "/ost-to-xps": "XPS",
    "/ost-to-tiff": "TIFF",
  };
  const currentFormat = formatMap[location.pathname] || "PST";

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

  const isPdf = currentFormat === "PDF";
  const isJson = currentFormat === "JSON";

  return (
    <section
      id="how-it-works"
      className="bg-[#f0f9ff] py-6 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* UPPER SECTION: 3 Steps + Video */}
        <div className="mb-10 md:mb-12">
          <div className="text-center mb-10 md:mb-12">
            <h2 className=" text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              How to convert<span className="text-brand-600"> OST to {currentFormat}</span>{" "}
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
              title={isJson ? "Download JSON File" : `Download ${currentFormat} File`}
              icon={Download}
            />
          </div>
        </div>

        {/* LOWER SECTION: 4 Detailed Steps */}
        <div className="border-t border-slate-200/50 pt-10 md:pt-12">
          <div className="text-center mb-12 md:mb-16 space-y-4 px-2">
            <p className="text-slate-600 text-base md:text-lg font-medium max-w-3xl mx-auto leading-relaxed">
              {isPdf 
                ? "The process of converting from an OST file to PDF is simple & user friendly; it does not require any kind of technical knowledge for conversion."
                : isJson
                ? "The process of converting from OST to JSON is simple & user friendly; it does not require any kind of technical knowledge for conversion."
                : `The process of converting from OST to ${currentFormat} is simple & user friendly; it does not require any kind of technical knowledge for conversion`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
            <DetailStepCard
              number={1}
              title="Upload Your OST File"
              description={
                isPdf || isJson ? (
                  <>
                    Simply drag and drop your file or click <strong>"Browse"</strong> to find the file on your computer. We currently support files up to 5 GB in size in our professional plans.
                  </>
                ) : (
                  <>
                    Simply drag and drop your file or click{" "}
                    <strong>Browse</strong> to find the file on your computer. We
                    currently support files up to 5 GB in size in our Professional
                    Plan.
                  </>
                )
              } 
            />
            <DetailStepCard
              number={2}
              title={isPdf ? "Preview your OST File" : isJson ? "Preview your OST File" : `Preview Your ${currentFormat} File`}
              description={isPdf 
                ? "When uploading is finished, you can preview and then download your OST file into multiple formats, or download your PDF file directly to your computer."
                : isJson
                ? "When uploading is finished, you can preview and then download your OST file into multiple formats, or download your OST file to JSON format directly to your computer."
                : `When uploading gets finished, you can preview and then download your OST file into multiple formats or either download your ${currentFormat} file directly to your computer.`}
            />
            <DetailStepCard
              number={3}
              title={isPdf ? "PDF Conversion Begins" : isJson ? "JSON Conversion Begins" : `${currentFormat} Conversion Begins`}
              description={isPdf
                ? "When your .ost file is uploaded, by clicking on either the download or export OST Emails to PDF option. It begins the conversion process in the selected format, and the download starts automatically."
                : isJson
                ? "When your .ost file is uploaded, by clicking on either the download or export option. It begins the conversion process in the selected format, and the download starts automatically."
                : `When your .ost file is uploaded, by clicking on either download or export option. It begins the conversion process in the selected format, and the download starts automatically.`}
            />
           
            <DetailStepCard
              number={4}
              title="Import into Outlook"
              description={isPdf
                ? "To use any edition of Microsoft Outlook to open a PDF, do File Menu → Open & Export → Import/Export. Once the PDF is opened, the emails, calendar appointments, and contacts will be available from within it."
                : isJson
                ? "To use any edition of Microsoft Outlook to open a JSON, do File Menu → Open & Export → Import/Export. Once the JSON is opened, the emails, calendar appointments, and contacts will be available from within it."
                : `To use any edition of Microsoft Outlook to open ${currentFormat}, do file Menu Open & Export Import/Export. Once the ${currentFormat} is opened the emails, calendar appointments and contacts will be available from within it.`}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
