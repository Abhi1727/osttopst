import React from "react";
import {
  LifeBuoy,
  CloudSync,
  ShieldAlert,
  UserMinus,
  HardDriveDownload,
  Hammer,
} from "lucide-react";

const ConversionMissions = () => {
  return (
    <section className="py-12 md:py-20 px-4 md:px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto space-y-20">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
            Why the <span className="text-emerald-600">Conversion</span> is
            Required
          </h2>
          <p className="text-slate-500 max-w-3xl mx-auto leading-relaxed">
            Understanding the reasons behind switching between these two formats
            is crucial for effective data recovery and migration. An OST file
            acts as a temporary <strong>"shadow"</strong> of the server, while a
            PST file serves as a permanent <strong>"standalone"</strong> file.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Mission 1: OST to PST */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white p-8 lg:p-12 rounded-3xl border border-slate-100 h-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-100 rounded-2xl">
                  <LifeBuoy className="w-8 h-8 text-emerald-700" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  Why Convert OST to PST? (The Rescue Mission)
                </h3>
              </div>

              <p className="text-slate-500 mb-8 border-l-4 border-emerald-500 pl-4 py-1 italic">
                Converting from OST to PST is the most common route taken. Since
                OST files are closely linked to the specific MAPI profile and
                server they were created on, you can't just transfer an OST file
                to a new computer and expect it to work.
              </p>

              <div className="grid md:grid-cols-2 gap-8 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
                    <ShieldAlert className="w-4 h-4 text-emerald-600" />
                    Server Crashes
                  </div>
                  <p className="text-slate-500">
                    If Exchange experiences a crash, your OST becomes orphaned.
                    Conversion allows you to "extract" data.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
                    <UserMinus className="w-4 h-4 text-emerald-600" />
                    Account Deletion
                  </div>
                  <p className="text-slate-500">
                    When Office 365 accounts are deleted, the local OST becomes
                    inaccessible. Convert to recover crucial emails.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
                    <HardDriveDownload className="w-4 h-4 text-emerald-600" />
                    Data Migration
                  </div>
                  <p className="text-slate-500">
                    Transitioning platforms simplifies by converting local cache
                    (OST) to a PST for easy importing.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
                    <Hammer className="w-4 h-4 text-emerald-600" />
                    Repairing Corruption
                  </div>
                  <p className="text-slate-500">
                    If sync fails, converting readable sections to PST helps
                    recover data before deleting corrupted files.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mission 2: PST to OST */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white p-8 lg:p-12 rounded-3xl border border-slate-100 h-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-amber-100 rounded-2xl">
                  <CloudSync className="w-8 h-8 text-amber-700" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  Why Convert PST to OST? (The Sync Mission)
                </h3>
              </div>

              <p className="text-slate-500 mb-8 border-l-4 border-amber-500 pl-4 py-1 italic">
                Technically, you don't "convert" a PST into an OST file with a
                simple software toggle. Instead, the process resembles more of
                an import or upload action.
              </p>

              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-6 h-6 border-2 border-amber-400 rounded-full shrink-0 flex items-center justify-center text-amber-600 font-bold text-xs mt-1">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">
                      Restoring Backups
                    </h4>
                    <p className="text-sm text-slate-500">
                      Import backups (PST) into Outlook to "push" data to the
                      server, integrating it into your active OST cache.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 border-2 border-amber-400 rounded-full shrink-0 flex items-center justify-center text-amber-600 font-bold text-xs mt-1">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">
                      Moving from POP3 to Cloud
                    </h4>
                    <p className="text-sm text-slate-500">
                      Upgrade from POP3 (PST) to Office 365 (OST) by moving data
                      into the OST environment for cloud sync.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 border-2 border-amber-400 rounded-full shrink-0 flex items-center justify-center text-amber-600 font-bold text-xs mt-1">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">
                      Consolidating Data
                    </h4>
                    <p className="text-sm text-slate-500">
                      Importing multiple old archive files ensures all mail is
                      searchable in one place and backed up by the server.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConversionMissions;
