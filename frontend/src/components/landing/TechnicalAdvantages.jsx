import React from "react";
import {
  Hammer,
  Scale,
  ShieldCheck,
  Cpu,
  Database,
  Binary,
  Lock,
  ShieldAlert,
  ServerCrash,
  UserX,
  UserPlus,
  ArrowRightLeft,
  Wrench,
  Archive,
} from "lucide-react";

const TechnicalAdvantages = () => {
  const whyReasons = [
    {
      icon: ServerCrash,
      title: "Crash of Exchange Server",
      description: "When your Exchange server crashes, you can still access your mailbox data using your offline OST file. Our tool converts it to PST for easy outlook access."
    },
    {
      icon: UserX,
      title: "Deleted or Expired Office 365 Account",
      description: "At the time of expiration of an Office 365 account, the link to the local OST file is effectively broken. Save your email history by converting to PST."
    },
    {
      icon: UserPlus,
      title: "Account Migration & Your Email",
      description: "Seamlessly transition between email accounts by converting your existing OST data for easy import into your new setup."
    },
    {
      icon: ArrowRightLeft,
      title: "Seamless Email Platform Migration",
      description: "Migrating from Exchange to Gmail or another tenant? Extracting data from your OST to PST is the most reliable way to maintain continuity."
    },
    {
      icon: Wrench,
      title: "Repair Corrupt Files",
      description: "Address OST header damage from power failures or syncing issues with our built-in repair functionality that restores file structure during conversion."
    },
    {
      icon: Archive,
      title: "Long-Term Email Archive",
      description: "Create portable, manageable PST archives of your email history for long-term storage and compliance needs."
    }
  ];

  return (
    <section className="min-h-screen flex items-center py-16 md:py-24 px-4 md:px-6 lg:px-12 bg-[#f0f7ff]">
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Technical Advantages */}
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="mb-4">
              Technical <span className="text-brand-600">Advantages</span> We Offer
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base md:text-lg font-medium">
              We tackle the complex technical challenges that traditional software often struggles with.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AdvantageCard
              icon={Hammer}
              title="Repairing Corruption"
              description="Built-in error correction can handle even the most severely damaged OST files during the conversion process."
              color="bg-brand-50"
              iconColor="text-brand-600"
            />
            <AdvantageCard
              icon={Scale}
              title="Deduplication"
              description="Automatically identifies and removes duplicate emails to ensure a clean and efficient PST output."
              color="bg-amber-50"
              iconColor="text-amber-600"
            />
            <AdvantageCard
              icon={ShieldCheck}
              title="Enterprise Security"
              description="Utilizing bank-grade encryption and security protocols to keep your corporate data safe during migration."
              color="bg-blue-50"
              iconColor="text-blue-600"
            />
          </div>
        </div>

        {/* Why Use Our Online Tool? */}
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="mb-4">
              Why Use Our <span className="text-brand-600">Online Tool?</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base md:text-lg font-medium">
              Experience the most reliable and efficient OST to PST conversion service available online.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyReasons.map((reason, index) => (
              <div key={index} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-brand-200 hover:bg-white hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <reason.icon className="w-7 h-7 text-brand-600 group-hover:text-white" />
                </div>
                <h3 className="mb-4">
                  {reason.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Variants Selection - Repurposed as a trust section */}
        <div className="bg-slate-900 rounded-[40px] p-8 md:p-16 text-white shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="mb-4">
                Supports All OST and <span className="text-brand-400">PST File Variants</span>
              </h3>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Our advanced engine is engineered to handle every variant of Outlook data file you might encounter, ensuring 100% compatibility.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                {[
                  "Unicode format (2007+)",
                  "ANSI format (97-2003)",
                  "Exchange Server versions",
                  "Encrypted OST files",
                  "Password-protected files",
                  "32-bit & 64-bit Outlook",
                  "Outlook for Microsoft 365",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-300 font-semibold">
                    <div className="w-2 h-2 rounded-full bg-brand-400"></div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SmallFeature icon={Binary} label="Unicode & ANSI" />
              <SmallFeature icon={Lock} label="Encrypted Files" />
              <SmallFeature icon={Database} label="Exchange Support" />
              <SmallFeature icon={ShieldAlert} label="Password Recovery" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const AdvantageCard = ({
  icon: Icon,
  title,
  description,
  color,
  iconColor,
}) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6 hover:shadow-xl transition-all group hover:-translate-y-1">
    <div
      className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}
    >
      <Icon className={`w-7 h-7 ${iconColor}`} />
    </div>
    <div className="space-y-4">
      <h3 className="">{title}</h3>
      <p className="text-slate-500 text-base font-medium leading-relaxed">{description}</p>
    </div>
  </div>
);

const SmallFeature = ({ icon: Icon, label }) => (
  <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center gap-4 text-center group hover:bg-white/10 transition-colors">
    <Icon className="w-8 h-8 text-brand-400" />
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
      {label}
    </span>
  </div>
);

export default TechnicalAdvantages;
