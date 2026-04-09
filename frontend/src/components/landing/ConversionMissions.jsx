import React from "react";
import { UserCircle, ShieldCheck, GraduationCap, Building2 } from "lucide-react";

const ConversionMissions = () => {
  const audiences = [
     {
      title: "Data Migration Specialists",
      description: "Great for data migration specialists who need to be able to easily migrate data from one mail platform & server to another with no data loss.",
    },
   
    {
      title: "IT Administrators",
      description: "Great for IT Administrators managing multiple user accounts, it can quickly convert, move, and restore all OSTs quickly and accurately across an organization.",
    },
    {
      title: "Outlook Users",
      description: "This product is useful for regular Outlook users whose mailbox cannot be accessed when the Exchange server is down or offline, and need to have access, recovery, or backup.",
    },
    {
      title: "Small to Large Businesses",
      description: "Whether you are a growing startup business or a very large, established corporation, our converter is designed and built for you and keeps pace with the ever-increasing demand for bulk mailbox migrations.",
    },
  ];

  return (
    <section className="min-h-screen flex items-center py-24 px-4 md:px-6 lg:px-12 bg-[#f0f9ff]">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className=" text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Ideal Users of <span className="text-brand-500">Our Converter</span>  
          </h2>
          <p className="text-slate-600 font-medium max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
            Trusted by individuals and enterprises worldwide for seamless data migration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {audiences.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-8 sm:p-10 md:p-12 bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all h-full"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 tracking-tight">
                {item.title}
              </h3>
              <p className="text-slate-500 leading-relaxed font-medium text-sm sm:text-base md:text-lg max-w-[480px]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ConversionMissions;
