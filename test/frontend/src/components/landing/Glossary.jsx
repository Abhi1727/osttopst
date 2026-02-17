import React from "react";
import { FileCode, Database, HardDrive, RefreshCcw } from "lucide-react";

const Glossary = () => {
  return (
    <section className="py-12 md:py-20 px-4 md:px-6 lg:px-12 bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            Understanding <span className="text-emerald-600">OST and PST</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            A quick guide to Outlook's primary data storage formats.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* PST Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-2xl">
                <FileCode className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">
                1. PST (Personal Storage Table)
              </h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              A PST file, often called an <strong>"Outlook Data File,"</strong>{" "}
              acts like a personal filing cabinet for all your emails, calendar
              events, and contacts.
            </p>
            <ul className="space-y-3 pt-4">
              <li className="flex gap-3 text-sm text-slate-500">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  •
                </div>
                <span>
                  <strong>Usage:</strong> Mainly used with POP3 email accounts
                  or for archiving older data. Exported backups are saved as
                  .pst files.
                </span>
              </li>
              <li className="flex gap-3 text-sm text-slate-500">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  •
                </div>
                <span>
                  <strong>Portability:</strong> Independent of the server.
                  Transfer via USB drive and open in Outlook easily.
                </span>
              </li>
              <li className="flex gap-3 text-sm text-slate-500">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  •
                </div>
                <span>
                  <strong>Storage:</strong> Stored on your hard drive, freeing
                  up space on your mail server.
                </span>
              </li>
            </ul>
          </div>

          {/* OST Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <RefreshCcw className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">
                2. OST (Offline Storage Table)
              </h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              An OST file is known as an{" "}
              <strong>"Offline Outlook Data File."</strong> Think of it as a
              synchronized mirror or a "cache" of what’s currently on the mail
              server.
            </p>
            <ul className="space-y-3 pt-4">
              <li className="flex gap-3 text-sm text-slate-500">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  •
                </div>
                <span>
                  <strong>Usage:</strong> Typically used with Microsoft
                  Exchange, Office 365, IMAP, and Outlook.com accounts.
                </span>
              </li>
              <li className="flex gap-3 text-sm text-slate-500">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  •
                </div>
                <span>
                  <strong>Synchronization:</strong> Allows offline work. Changes
                  sync to the server once online.
                </span>
              </li>
              <li className="flex gap-3 text-sm text-slate-500">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  •
                </div>
                <span>
                  <strong>Safety Net:</strong> Just a copy. Fresh OST files are
                  automatically recreated from the server if needed.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Glossary;
