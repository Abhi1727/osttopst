import React from "react";
import {
  Hammer,
  Scale,
  Copy,
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
      icon: Database,
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
        <div className="space-y-10 md:space-y-16">
          <div className="text-center space-y-4 px-2">
            <h2 className="text-brand-500 text-2xl sm:text-3xl md:text-4xl font-bold">
              Technical Advantages We Offer
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-medium">
              We tackle the complex technical challenges that traditional software often struggles with.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AdvantageCard
              icon={Wrench}
              title="Repairing Corruption"
              description="Built-in error correction can handle even the most severely damaged OST files during the conversion process."
            />
            <AdvantageCard
              icon={Copy}
              title="Deduplication"
              description="Automatically identifies and removes duplicate emails to ensure a clean and efficient PST output."
            />
            <AdvantageCard
              icon={ShieldCheck}
              title="Enterprise Security"
              description="Utilizing bank-grade encryption and security protocols to keep your corporate data safe during migration."
            />
          </div>
        </div>

        {/* Why Use Our Online Tool? */}
        <div className="space-y-10 md:space-y-16">
          <div className="text-center space-y-4 px-2">
            <h2 className="text-brand-500 text-2xl sm:text-3xl md:text-4xl font-bold">
              Why Use Our Online Tool?
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-medium">
              Experience the most reliable and efficient OST to PST conversion service available online.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyReasons.map((reason, index) => (
              <AdvantageCard
                key={index}
                icon={reason.icon}
                title={reason.title}
                description={reason.description}
              />
            ))}
          </div>
        </div>

        {/* PST File Variants - Dark Section */}
        <div className="bg-black rounded-3xl md:rounded-[40px] p-8 sm:p-10 md:p-16 text-white text-center space-y-10 md:space-y-12 shadow-2xl overflow-hidden relative">
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              PST File Variants
            </h2>
            <p className="max-w-4xl mx-auto text-slate-300 text-sm sm:text-base md:text-lg font-medium leading-relaxed opacity-90 px-0 sm:px-4">
              Our advanced engine is engineered to handle every variant of Outlook data file you might encounter, ensuring 100% compatibility.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 sm:gap-y-6 gap-x-4 max-w-5xl mx-auto text-left text-slate-300 text-sm md:text-base font-semibold px-0 sm:px-4">
            {[
              "Unicode format (2007+)",
              "ANSI format (97-2003)",
              "Exchange Server versions",
              "Encrypted OST files",
              "Password-protected files",
              "32-bit & 64-bit Outlook",
              "Outlook for Microsoft 365",
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                {item}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <SmallFeature icon={Binary} label="Unicode & ANSI" />
            <SmallFeature icon={Lock} label="Encrypted Files" />
            <SmallFeature icon={Database} label="Exchange Support" />
            <SmallFeature icon={ShieldAlert} label="Password Recovery" />
          </div>
        </div>
      </div>
    </section>
  );
};

const AdvantageCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-5 md:space-y-6 hover:shadow-lg transition-all transform hover:-translate-y-1 h-full">
    <div className="text-slate-700">
      <Icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
    </div>
    <div className="space-y-3 md:space-y-4">
      <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
        {title}
      </h3>
      <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed max-w-[280px]">
        {description}
      </p>
    </div>
  </div>
);

const SmallFeature = ({ icon: Icon, label }) => (
  <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center gap-3 sm:gap-4 text-center group hover:bg-white/20 transition-all cursor-default">
    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={1.5} />
    <span className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-widest leading-tight">
      {label}
    </span>
  </div>
);

export default TechnicalAdvantages;
