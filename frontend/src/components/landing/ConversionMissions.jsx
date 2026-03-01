import React from "react";
import { Trash2, Monitor, ArrowRightLeft, Puzzle, Package } from "lucide-react";

const ConversionMissions = () => {
  const scenarios = [
    {
      icon: <div className="w-4 h-4 rounded-full bg-emerald-500 shrink-0" />,
      title: "Exchange Server Crash or Failure",
      description:
        'When an Exchange server crashes, your OST file becomes "orphaned" and disconnected. Our free OST to PST conversion tool extracts all readable data from the OST file and saves it into a portable, accessible PST — your rescue lifeline.',
    },
    {
      icon: <Trash2 className="w-5 h-5 text-emerald-500 shrink-0" />,
      title: "Deleted or Expired Office 365 Account",
      description:
        "Once an Office 365 or Exchange account is deleted or expires, the local OST file becomes inaccessible. Converting OST into PST before deletion — or after via our recovery engine — is the only way to retain your email history.",
    },
    {
      icon: <Monitor className="w-5 h-5 text-emerald-500 shrink-0" />,
      title: "New PC or Outlook Reinstall",
      description:
        "OST files are machine- and profile-specific. You cannot simply copy an OST to a new PC and open it. Converting OST to PST first gives you a fully portable file you can import on any machine.",
    },
    {
      icon: <ArrowRightLeft className="w-5 h-5 text-emerald-500 shrink-0" />,
      title: "Email Platform Migration",
      description:
        "Moving from Exchange to Gmail, or from one Office 365 tenant to another? Converting your local OST file to PST is the cleanest way to extract and preserve your email data for re-importing into the new platform.",
    },
    {
      icon: <Puzzle className="w-5 h-5 text-emerald-500 shrink-0" />,
      title: "Repairing a Corrupt OST File",
      description:
        "Sync failures, sudden shutdowns, and disk errors can corrupt OST files. Our free OST to PST converter includes automatic header and structure repair, extracting the maximum amount of recoverable data before it's lost forever.",
    },
    {
      icon: <Package className="w-5 h-5 text-emerald-500 shrink-0" />,
      title: "Long-Term Email Archiving",
      description:
        "Unlike OST files which are volatile caches, PST files are permanent standalone archives. Converting your OST files to PST is the standard method for long-term email archiving, compliance, and legal hold purposes.",
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900">
            When Do You Need to Convert OST File to PST?
          </h2>
          <p className="text-slate-500 max-w-3xl mx-auto text-lg leading-relaxed">
            These are the most common real-world scenarios where users urgently
            need a reliable free OST to PST converter.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {scenarios.map((scenario, idx) => (
            <div
              key={idx}
              className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all"
            >
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  {scenario.icon}
                </div>
                {scenario.title}
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                {scenario.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ConversionMissions;
