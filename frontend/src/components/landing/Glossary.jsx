import React from "react";
import { FileCode, RefreshCw } from "lucide-react";

const Glossary = () => {
  return (
    <section className="min-h-screen flex items-center py-16 md:py-20 bg-[#f0f7ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 md:space-y-12">
          <div className="text-center space-y-2">
            <h2 className="">
              Understanding{" "}
              <span className="text-brand-600">OST and PST</span>
            </h2>
            <p className="text-slate-500 max-w-3xl mx-auto text-base md:text-lg leading-relaxed font-medium">
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
                <h3 className="">
                  PST (Personal Storage Table)
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed font-medium">
                  A PST file is also called an{" "}
                  <strong className="text-slate-900">"Outlook Data File,"</strong> which is simply an
                  archived version of the email messages, as well as
                  appointments, contacts, and to-dos that could be saved onto
                  one's computer independently from any email server account.
                </p>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    <strong className="text-slate-800">
                      Purpose:
                    </strong>{" "}
                    Stores emails and other data as a personal archive.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    <strong className="text-slate-800">
                      Server:
                    </strong>{" "}
                    Not linked to the server account.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    <strong className="text-slate-800">
                      Adaptability:
                    </strong>{" "}
                    Can be smoothly shifted and opened on another system.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
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
                <h3 className="">
                  OST (Offline Storage Table)
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed font-medium">
                  An OST file is known as an{" "}
                  <strong className="text-slate-900">"Offline Outlook Data File."</strong> This type of
                  file allows you to work even when you are not connected to the
                  Internet. It will later sync any changes back to the server.
                </p>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    <strong className="text-slate-800">
                      Purpose:
                    </strong>{" "}
                    Stores the synced copy of mailbox data for the usage of offline.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    <strong className="text-slate-800">
                      Server:
                    </strong>{" "}
                    It is connected to an Exchange, Office 365, or IMAP account.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    <strong className="text-slate-800">
                      Adaptability:
                    </strong>{" "}
                    Cannot be smoothly shifted to another desktop or profile.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
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

export default Glossary;
