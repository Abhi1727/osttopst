import React from "react";
import { UserCircle, FolderUp, GraduationCap, Store } from "lucide-react";

const ConversionMissions = () => {
  const topAudiences = [
    {
      icon: (
        <UserCircle className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
      ),
      title: "Outlook Users",
      description: "Access mail when Exchange is offline",
    },
    {
      icon: (
        <FolderUp className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
      ),
      title: "IT Administrators",
      description: "Manage entire organization migrations.",
    },
    {
      icon: (
        <GraduationCap
          className="w-10 h-10 text-emerald-600"
          strokeWidth={1.5}
        />
      ),
      title: "Data Migration Specialists",
      description: "Zero data loss migration experts.",
    },
    {
      icon: <Store className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />,
      title: "Small to Large Businesses",
      description: "Build for bulk mailbox demand.",
    },
  ];

  const bottomAudiences = [
    {
      number: "1",
      title: "Outlook Users",
      description:
        "This product is useful for regular Outlook users whose mailbox cannot be accessed when the Exchange server is down or offline and need to have access, recovery or backup of their OST files.",
    },
    {
      number: "2",
      title: "IT Administrators",
      description:
        "Great for IT Administrators managing multiple user accounts; can quickly convert/move/restore all OSTs quickly and accurately across an organization.",
    },
    {
      number: "3",
      title: "Data Migration Specialists",
      description:
        "Great for data migration specialists who need to be able to easily migrate data from one mail platform/server to another with no data loss.",
    },
    {
      number: "4",
      title: "Small to Large Businesses",
      description:
        "Whether you are a growing startup business or a very large, established corporation, our converter is designed and built for you and keeps pace with the ever-increasing demand for bulk mailbox migrations and data recoveries quickly, reliably and cost efficiently.",
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center">
          <h2 className="text-3xl md:text-3xl font-extrabold text-slate-900">
            Who is our Converter useful for?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {topAudiences.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center space-y-4 group"
            >
              <div className="w-20 h-20 bg-emerald-50/50 rounded-full flex items-center justify-center mb-2 shadow-sm border border-emerald-100/50 group-hover:shadow-md group-hover:scale-105 transition-all">
                {item.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500 italic w-full leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {bottomAudiences.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group min-h-[300px]"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <span className="text-emerald-600 font-bold text-lg">
                  {item.number}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 px-2">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
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
