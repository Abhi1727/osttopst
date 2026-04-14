import React from "react";
import { motion } from "framer-motion";
import { Scale, MessageSquare, AlertCircle, FileText, CheckCircle, Info, Shield, HelpCircle } from "lucide-react";

const Section = ({ title, icon: Icon, children, delay }) => (
  <motion.section 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="mb-12 group"
  >
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 shadow-sm border border-brand-100 group-hover:border-brand-600">
        <Icon className="w-6 h-6" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight group-hover:text-brand-600 transition-colors">{title}</h2>
    </div>
    <div className="text-slate-600 leading-relaxed space-y-4 pl-2 border-l-2 border-slate-100 group-hover:border-brand-200 transition-colors ml-7 pr-4">
      {children}
    </div>
  </motion.section>
);

const TermsConditions = () => {
  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col pt-4 selection:bg-brand-100 selection:text-brand-900">
      {/* Premium Header */}
      <header className="relative bg-white pt-4 pb-20 px-4 text-center overflow-hidden border-b border-slate-100">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[60%] bg-brand-50/30 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-purple-50/30 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-[0.2em] mb-8 border border-brand-100">
              <Shield className="w-3.5 h-3.5" />
              Legal Documentation
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-none">
              Terms & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Conditions</span>
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
              Last updated: April 4, 2026. These terms govern your use of the OST to PST Converter Tool software and services.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="max-w-5xl mx-auto px-6 py-20 pb-40">
        <div className="bg-white rounded-[40px] p-8 md:p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative">
          
          <div className="absolute top-0 right-0 p-8 hidden md:block">
             <HelpCircle className="w-12 h-12 text-slate-50 opacity-[0.03]" />
          </div>

          <Section title="1. Agreement to Terms" icon={CheckCircle} delay={0.1}>
            <p className="text-lg">
              You accept these Terms and Conditions when you <span className="font-semibold text-slate-800">(a) Download</span> <span className="font-semibold text-slate-800">(b) Install</span> <span className="font-semibold text-slate-800">(c) Use the Software</span>. If you do not want to accept our Terms and Conditions, do not download or install or use the Software.
            </p>
          </Section>

          <Section title="2. License Grant" icon={FileText} delay={0.2}>
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-brand-500" />
                   Analysis Version
                </h3>
                <p>We grant you an analysis version license (Non-Exclusive, No Transfer) to use the "Free/Trial" version as an analysis tool. The Analysis version may limit the number of times you can use a specific folder.</p>
              </div>
              
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-500" />
                   Full Version
                </h3>
                <p>When you purchase a Full Version license from us, you will receive a license to use the Software based on the specific Product Edition you purchased. Unless stated otherwise at the time of your purchase, your license will generally be limited to either the number of "systems" or the number of "users."</p>
              </div>
            </div>
          </Section>

          <Section title="3. Software Nature" icon={Info} delay={0.3}>
            <p className="mb-4">
              This software is intended to translate Outlook Offline Storage Files (OST) to Personal Storage Files (PST) or any other file format. You also understand that:
            </p>
            <ul className="space-y-4">
               {[
                 "OST files are associated with a specific MAPI Profile.",
                 "The success for converting the file from one format to another can vary based on the condition of the source file.",
                 "The Software is simply a tool that is not a guarantee that you will be able to recover 100% of your data."
               ].map((item, idx) => (
                 <li key={idx} className="flex gap-4 items-start">
                   <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                   <span>{item}</span>
                 </li>
               ))}
            </ul>
          </Section>

          <Section title="4. User Responsibilities and Data Safety" icon={Shield} delay={0.4}>
            <div className="space-y-4">
              <p><strong className="text-slate-900 font-bold block mb-1">Backup Required:</strong> You must create a backup of the original OST files prior to beginning conversion. osttopst.us is not responsible for any damage or loss that you may sustain to your original file as a result of the process.</p>
              <p><strong className="text-slate-900 font-bold block mb-1">Legal Use:</strong> You agree to utilize the software only for files that you have been legally authorized to access. You must not utilize this tool to circumvent any security measures in place on files that are not yours.</p>
            </div>
          </Section>

          <Section title="5. Ownership of Intellectual Property" icon={MessageSquare} delay={0.5}>
            <p className="mb-6">
              OST to PST Converter Tool’s Software, and all rights, titles, and interests therein, are exclusively owned by OST to PST Converter Tool. You must not do any of the following:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-red-50 hover:border-red-100 transition-colors">
                 <p className="text-sm font-medium text-slate-700">Reverse engineer, decompile, or disassemble the Software.</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-red-50 hover:border-red-100 transition-colors">
                 <p className="text-sm font-medium text-slate-700">Distribute any “cracked” copies of the Software or license keys for the Software.</p>
              </div>
            </div>
          </Section>

          <Section title="6. Limitations of Liability" icon={AlertCircle} delay={0.6}>
            <p className="p-6 bg-amber-50/50 border border-amber-100 rounded-3xl text-slate-700 italic">
              "To the maximum extent permitted by law, OST to PST Converter Tool is not responsible for any indirect damages, loss of data due to software bugs or hardware failure or user error. The maximum liability that can occur in relation to your purchase of a license for OST to PST Converter Tool’s Software is equal to the total amount paid for the software."
            </p>
          </Section>

          <Section title="7. Refund Policy" icon={CheckCircle} delay={0.7}>
            <p className="mb-6">
              We give you the opportunity to evaluate our software using the "Try Before You Buy" version, and as such, you generally will not receive a refund unless:
            </p>
            <div className="space-y-3">
               {[
                 "The trial version of our software fails to convert your files as shown in the trial.",
                 "Our technical support team is not able to resolve the issue within two (2) business days."
               ].map((item, idx) => (
                 <div key={idx} className="flex gap-3 items-center p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50 text-emerald-900 font-medium">
                   <div className="p-1 bg-emerald-100 rounded-md">
                     <CheckCircle className="w-4 h-4" />
                   </div>
                   {item}
                 </div>
               ))}
            </div>
          </Section>

          <Section title="8. No Warranty" icon={AlertCircle} delay={0.8}>
            <p className="bg-slate-900 text-slate-300 p-8 rounded-[32px] text-sm leading-relaxed font-mono shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <FileText className="w-12 h-12" />
               </div>
              The Software is provided to you "as is", without guarantee or warranty of any kind, express, implied or statutory. There are no implied warranties, including but not limited to the implied warranties of merchantability and fitness for a particular purpose. We cannot guarantee that there will be any errors in the Software, nor can we provide support for any errors, nor will we guarantee recovery of data from any type of corruption in your files.
            </p>
          </Section>

          <Section title="9. Jurisdiction" icon={Scale} delay={0.9}>
            <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-3xl">
              <p className="text-indigo-900 font-medium text-lg leading-relaxed">
                The terms under this Agreement shall be governed by and construed under the laws of the United States of America. All disputes concerning this Agreement shall be resolved in the courts of your country.
              </p>
            </div>
          </Section>

          {/* Footer Contact */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-24 pt-12 border-t border-slate-100 text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-50 text-slate-500 text-sm font-medium border border-slate-100 mb-4">
               <MessageSquare className="w-4 h-4" />
               Need clarification?
            </div>
            <p className="text-slate-400 text-sm">
              If you have any questions about these Terms & Conditions, please contact our legal team at{" "}
              <a href="mailto:support@osttopst.us" className="text-brand-600 font-bold hover:underline">
                support@osttopst.us
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
