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
} from "lucide-react";

const TechnicalAdvantages = () => {
  return (
    <section className="py-12 md:py-20 px-4 md:px-6 lg:px-12 bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-20">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
            Technical <span className="text-emerald-600">Advantages</span> We
            Offer
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            We tackle the complex technical challenges that consumer software
            often struggles with.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <AdvantageCard
            icon={Hammer}
            title="Repairing Corruption"
            description="OST files can suffer from 'dirty shutdowns.' We utilize professional-grade tools to fix header errors during the conversion process."
            color="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <AdvantageCard
            icon={Scale}
            title="Deduplication"
            description="We eliminate duplicate emails along the way, resulting in a final PST file that is smaller, cleaner, and more efficient."
            color="bg-amber-50"
            iconColor="text-amber-600"
          />
          <AdvantageCard
            icon={ShieldCheck}
            title="Enterprise Security"
            description="We ensure a secure, encrypted pipeline for data transfer, avoiding the risks associated with dubious 'free' converters."
            color="bg-blue-50"
            iconColor="text-blue-600"
          />
        </div>

        <div className="bg-white rounded-3xl p-10 lg:p-16 border border-slate-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 opacity-50"></div>
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
                Broad Compatibility Across All OST & PST Variants
              </h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Our free OST to PST converter software is engineered to handle every variant of OST and PST file you might encounter.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Unicode format (2007+)",
                  "ANSI format (97-2003)",
                  "Exchange Server versions",
                  "Encrypted OST files",
                  "Password-protected files",
                  "32-bit & 64-bit Outlook",
                  "Outlook for Microsoft 365",
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm text-slate-700 font-medium"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
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
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6 hover:shadow-md transition-shadow group">
    <div
      className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}
    >
      <Icon className={`w-7 h-7 ${iconColor}`} />
    </div>
    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
  </div>
);

const SmallFeature = ({ icon: Icon, label }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col items-center gap-3 text-center group ">
    <Icon className="w-6 h-6 text-slate-400" />
    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
      {label}
    </span>
  </div>
);

export default TechnicalAdvantages;
