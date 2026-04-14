import { useLocation } from "react-router-dom";

const Glossary = () => {
  const location = useLocation();
  const isPdf = location.pathname === "/ost-to-pdf";
  const isJson = location.pathname === "/ost-to-json";
  const isMbox = location.pathname === "/ost-to-mbox";
  const isEml = location.pathname === "/ost-to-eml";
  const currentFormat = isPdf ? "PDF" : isJson ? "JSON" : isMbox ? "MBOX" : isEml ? "EML" : "PST";

  return (
    <section className="flex items-center py-6 md:py-8 bg-[#f0f7ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 md:space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Understanding <span className="text-brand-500">OST and {currentFormat}</span>
            </h2>
            <p className="text-slate-600 max-w-3xl mx-auto text-base md:text-lg leading-relaxed font-medium">
              A quick guide to Outlook's primary data storage formats.
            </p>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* OST Card */}
             <div className="bg-white p-6 sm:p-10 lg:p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full space-y-6 sm:space-y-8 transition-all hover:shadow-md">
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
            {/* Second Card (PST/PDF/JSON) */}
            <div className="bg-white p-6 sm:p-10 lg:p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full space-y-6 sm:space-y-8 transition-all hover:shadow-md">
              <div className="text-center space-y-2">
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800">
                  {currentFormat}
                </h3>
                <p className="text-lg sm:text-xl text-slate-600 font-medium">
                  ({isPdf ? "Portable Document Format" : isJson ? "JavaScript Object Notation" : isMbox ? "Mailbox Storage File" : isEml ? "Email Message Format" : "Personal Storage Table"})
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6 text-slate-700">
                <p className="leading-relaxed text-sm sm:text-base md:text-lg font-medium">
                  {isPdf ? (
                    <>
                      A PDF file is also known as <strong>Portable Document Format</strong>. This file type is utilized to present documents in a consistent layout across all devices and platforms, instead of software or any functioning system.
                    </>
                  ) : isJson ? (
                    <>
                      A JSON file is also known as <strong>JavaScript Object Notation</strong>. This file type is utilized to gather and exchange organized data into a light, text-based structure, which is simple for humans as well as machines to read and process.
                    </>
                  ) : isMbox ? (
                    <>
                      An MBOX file is also known as a <strong>Mailbox Storage File</strong>. This file type collects several email messages into a single text file, with all messages saved consecutively. It is used by various email clients for gathering large volumes of emails effectively.
                    </>
                  ) : isEml ? (
                    <>
                      An EML file is also known as an <strong>Email Message Format</strong>. This file type gathers one email message with content, attachments, headers and data in a usual format. It is mainly used for saving emails of an individual and can be viewed by several email clients.
                    </>
                  ) : (
                    <>
                      A PST file is also called an <strong>"Outlook Data File"</strong> which is
                      simply an archived version of the email messages, as well as
                      appointments, contacts, and to-dos that could be saved onto
                      one's computer independently from any email server account (it
                      can be created as needed).
                    </>
                  )}
                </p>
                <div className="space-y-3 sm:space-y-4 pt-2">
                  <p className="text-sm sm:text-base md:text-lg">
                    <strong className="text-slate-900">Purpose:</strong> {isPdf ? "Protects the document format for sharing, archiving, and printing." : isJson ? "Gathers and exchanges organized data between the server and applications." : isMbox ? "Gathers email message collections in one file for smooth management and backup." : isEml ? "Gathers one email message with all details containing attachments, data, and formats." : "Stores emails and other data as a personal archive."}
                  </p>
                  <p className="text-sm sm:text-base md:text-lg">
                    <strong className="text-slate-900">Server:</strong> {isPdf ? "Not rely on any server, an independent format." : isJson ? "Utilized with web servers and APIs for the transmission of data." : isMbox ? "Not related to any particular server, but it is a locally stored file format that is generated from several email services." : isEml ? "Not directly linked to any server, it is a local file and can be saved from several email services." : "Not linked to the server account."}
                  </p>
                  <p className="text-sm sm:text-base md:text-lg">
                    <strong className="text-slate-900">Adaptability:</strong>{" "}
                    {isPdf ? "It is portable and can be opened on any device" : isJson ? "It is adaptable and used on various programming languages and platforms." : isMbox ? "Assisted by several email clients, but the compatibility differs a bit." : isEml ? "It is highly adaptable and can be opened in various email clients." : "Can be smoothly shifted and opened on another system."}
                  </p>
                  <p className="text-sm sm:text-base md:text-lg">
                    <strong className="text-slate-900">Usage:</strong> {isPdf ? "Use for safe and secure document sharing, invoices, and others." : isJson ? "Mainly for web applications, APIs, and data exchange between the systems." : isMbox ? "Used for email archiving, migration, and backup on different email platforms." : isEml ? "Used for saving emails, sharing content, email backup, migration between platforms." : "Utilized for backup, storage, as well as for the migration."}
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
