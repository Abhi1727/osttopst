import React from "react";

const Glossary = () => {
  return (
    <section className="min-h-screen flex items-center py-16 md:py-20 bg-[#f0f7ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 md:space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Understanding <span className="text-brand-500">OST and PST</span>
            </h2>
            <p className="text-slate-600 max-w-3xl mx-auto text-base md:text-lg leading-relaxed font-medium">
              A quick guide to Outlook's primary data storage formats.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* OST Card */}
             <div className="bg-white p-6 sm:p-8 md:p-14 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 space-y-6 sm:space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800">
                  OST
                </h3>
                <p className="text-lg sm:text-xl text-slate-600 font-medium">
                  (Offline Storage Table)
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6 text-slate-700">
                <p className="leading-relaxed text-sm sm:text-base md:text-lg font-medium">
                  An OST file is known as an <strong>"Offline Outlook Data File."</strong> This
                  type of file allows you to work even when you are not
                  connected to the Internet. It will also allow you to use the
                  system while offline and then later sync any changes back to
                  the server.
                </p>
                <div className="space-y-3 sm:space-y-4 pt-2">
                  <p className="text-sm sm:text-base md:text-lg">
                    <strong className="text-slate-900">Purpose:</strong> Stores
                    the synced copy of mailbox data for the usage of offline.
                  </p>
                  <p className="text-sm sm:text-base md:text-lg">
                    <strong className="text-slate-900">Server:</strong> It is
                    connected to an Exchange, Office 365, or IMAP account.
                  </p>
                  <p className="text-sm sm:text-base md:text-lg">
                    <strong className="text-slate-900">Adaptability:</strong>{" "}
                    Cannot be smoothly shifted to another desktop or profile.
                  </p>
                  <p className="text-sm sm:text-base md:text-lg">
                    <strong className="text-slate-900">Usage:</strong> Utilized
                    for temporary offline availability.
                  </p>
                </div>
              </div>
            </div>
            {/* PST Card */}
            <div className="bg-white p-6 sm:p-8 md:p-14 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 space-y-6 sm:space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800">
                  PST
                </h3>
                <p className="text-lg sm:text-xl text-slate-600 font-medium">
                  (Personal Storage Table)
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6 text-slate-700">
                <p className="leading-relaxed text-sm sm:text-base md:text-lg font-medium">
                  A PST file is also called an <strong>"Outlook Data File"</strong> which is
                  simply an archived version of the email messages, as well as
                  appointments, contacts, and to-dos that could be saved onto
                  one’s computer independently from any email server account (it
                  can be created as needed).
                </p>
                <div className="space-y-3 sm:space-y-4 pt-2">
                  <p className="text-sm sm:text-base md:text-lg">
                    <strong className="text-slate-900">Purpose:</strong> Stores
                    emails and other data as a personal archive.
                  </p>
                  <p className="text-sm sm:text-base md:text-lg">
                    <strong className="text-slate-900">Server:</strong> Not
                    linked to the server account.
                  </p>
                  <p className="text-sm sm:text-base md:text-lg">
                    <strong className="text-slate-900">Adaptability:</strong>{" "}
                    Can be smoothly shifted and opened on another system.
                  </p>
                  <p className="text-sm sm:text-base md:text-lg">
                    <strong className="text-slate-900">Usage:</strong> Utilized
                    for backup, storage, as well as for the migration.
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
