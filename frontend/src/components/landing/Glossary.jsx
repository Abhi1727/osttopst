import React from "react";
import { FileCode, Database, HardDrive, RefreshCcw } from "lucide-react";

const Glossary = () => {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6 lg:px-12 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Conversion Steps Section */}
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              How Do I Convert <span className="text-emerald-600">OST to PST</span>?
            </h2>
            <p className="text-slate-500 max-w-3xl mx-auto text-lg leading-relaxed">
              The process of converting from OST to PST is simple even if you do
              not have a technical background. This service is designed for the
              average computer user.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center space-y-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center">
                Upload Your OST File
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm text-center">
                Simply drag and drop your file or click "Browse" to find the
                file on your computer. We currently support files up to 50 GB in
                size.
              </p>
            </div>
            {/* Step 2 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center space-y-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center">
                Automatic-Conversion Begins
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm text-center">
                When your .ost file is uploaded it instantly begins the
                conversion process (your file will first be repaired if it is
                corrupt) and then will be converted to a PST file.
              </p>
            </div>
            {/* Step 3 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center space-y-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center">
                Preview & Your PST File
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm text-center">
                When finished you can preview what you have converted and then
                download your PST file directly to your computer.
              </p>
            </div>
            {/* Step 4 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center space-y-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">
                4
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center">
                Import into Outlook
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm text-center">
                To use any edition of Microsoft Outlook to open PST, do File
                Menu → Open & Export → Import/Export. Once the PST is opened,
                the emails, calendar appointments, and contacts will be
                available from within it.
              </p>
            </div>
          </div>
        </div>

        {/* Glossary Section */}
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              Understanding{" "}
              <span className="text-emerald-600">OST and PST</span>
            </h2>
            <p className="text-slate-500 max-w-3xl mx-auto text-lg leading-relaxed">
              A quick guide to Outlook's primary data storage formats.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* PST Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-2xl">
                  <FileCode className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  PST (Personal Storage Table)
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  A PST file is also called an{" "}
                  <strong>"Outlook Data File,"</strong> which is simply an
                  archived version of the email messages as well as
                  appointments, contacts, and to-dos that could be saved onto
                  one’s computer independently from any email server account (it
                  can be created as needed).
                </p>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">
                      Usage & Portability:
                    </strong>{" "}
                    Used with POP3 Email Accounts and for offline archiving. PST
                    files are highly portable; they can be transferred via a USB
                    drive and opened on any computer with Microsoft Outlook
                    installed.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">
                      Storage & Availability:
                    </strong>{" "}
                    Saving them to a local hard drive frees up space on the
                    email server. They are available across all versions of
                    Microsoft Outlook (2010+) and are excellent for the
                    retention of long-term email records.
                  </p>
                </div>
              </div>
            </div>

            {/* OST Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-2xl">
                  <RefreshCcw className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  OST (Offline Storage Table)
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  An OST file is known as an{" "}
                  <strong>"Offline Outlook Data File."</strong> This type of
                  file allows you to work even when you are not connected to the
                  Internet. It will also allow you to use the system while
                  offline and then later sync any changes back to the server.
                </p>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">
                      Usage & Synchronization:
                    </strong>{" "}
                    Typically used with Microsoft Exchange, Office 365, IMAP,
                    and Outlook.com accounts. It acts as a safety net—since it's
                    just a cached copy, a fresh OST is automatically recreated
                    from the server if needed.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">
                      Accessibility Limits:
                    </strong>{" "}
                    They are tied tightly to a specific MAPI profile or account
                    on a specific machine. You cannot simply copy an OST file
                    and open it from a different machine or account.
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
