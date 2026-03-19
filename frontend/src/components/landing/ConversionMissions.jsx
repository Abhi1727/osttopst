import React from "react";
import { UserCircle, ShieldCheck, GraduationCap, Building2 } from "lucide-react";

const ConversionMissions = () => {
  const audiences = [
    {
      icon: <UserCircle className="w-8 h-8 md:w-10 md:h-10 text-brand-600" strokeWidth={1.5} />,
      title: "Outlook Users",
      description: "This product is useful for regular Outlook users whose mailbox cannot be accessed when the Exchange server is down or offline, and need to have access, recovery, or backup of their OST files.",
    },
    {
      icon: <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-brand-600" strokeWidth={1.5} />,
      title: "IT Administrators",
      description: "Great for IT Administrators managing multiple user accounts, it can quickly convert/move/restore all OSTs quickly and accurately across an organization.",
    },
    {
      icon: <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-brand-600" strokeWidth={1.5} />,
      title: "Data Migration Specialists",
      description: "Great for data migration specialists who need to be able to easily migrate data from one mail platform/server to another with no data loss.",
    },
    {
      icon: <Building2 className="w-8 h-8 md:w-10 md:h-10 text-brand-600" strokeWidth={1.5} />,
      title: "Small to Large Businesses",
      description: "Whether you are a growing startup business or a very large, established corporation, our converter is designed and built for you and keeps pace with the ever-increasing demand for bulk mailbox migrations and data recoveries quickly, reliably, and cost-efficiently.",
    },
  ];

  return (
    <section className="min-h-screen flex items-center py-16 md:py-24 px-4 md:px-6 lg:px-12 bg-slate-50/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-extrabold text-slate-900 tracking-tight">
            Ideal <span className="text-brand-600">Users</span> of Our Converter  
          </h2>
          <p className="mt-4 text-slate-500 font-medium max-w-2xl mx-auto">
            Trusted by individuals and enterprises worldwide for seamless data migration.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {audiences.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group hover:-translate-y-1"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-brand-500 group-hover:text-white transition-all">
                <span className="group-hover:text-white transition-colors">
                  {item.icon}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 mb-4 tracking-tight">
                {item.title}
              </h3>
              <p className="text-slate-500 leading-relaxed font-medium text-sm md:text-base">
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
