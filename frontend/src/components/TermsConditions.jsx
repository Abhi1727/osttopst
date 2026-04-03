import React from "react";
// import { motion } from "framer-motion";
import { Scale, MessageSquare, AlertCircle, FileText, CheckCircle } from "lucide-react";

const Section = ({ title, icon: Icon, children }) => (
  <section 
    className="mb-12"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
        <Icon className="w-6 h-6" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
    </div>
    <div className="text-slate-600 leading-relaxed space-y-4">
      {children}
    </div>
  </section>
);

const TermsConditions = () => {
  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col">
      {/* Header Section */}
      <header className="bg-gradient-to-b from-brand-50 to-slate-50 pt-8 pb-8 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div>
            <span className="inline-block bg-brand-100 text-brand-700 text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-8">
              Legal
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter">
              Terms & <span className="text-brand-500">Conditions</span>
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
              Last updated: March 14, 2026. Please read these terms carefully.
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 pb-32">
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100">
          
          <Section title="Acceptance of Terms" icon={CheckCircle}>
            <p>
              By accessing and using OSTtoPST.us, you agree to be bound by these Terms & Conditions. If you do not agree to all of these terms, do not use our services.
            </p>
          </Section>

          <Section title="Description of Service" icon={FileText}>
            <p>
              OSTtoPST.us provides a web-based service that converts Outlook Offline Storage Table (.OST) files into Personal Storage Table (.PST) files and other supported formats. We reserve the right to modify or discontinue the service at any time without notice.
            </p>
          </Section>

          <Section title="User Obligations" icon={Scale}>
            <p>
              When using our service, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Only upload files that you have the legal right to convert.</li>
              <li>Not use the service for any illegal or unauthorized purpose.</li>
              <li>Not attempt to reverse engineer or interfere with the proper working of the website.</li>
              <li>Be responsible for any taxes associated with paid plans.</li>
            </ul>
          </Section>

          <Section title="Intellectual Property" icon={MessageSquare}>
            <p>
              The website, including its original content, features, and functionality, are owned by OSTtoPST.us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </Section>

          <Section title="Limitation of Liability" icon={AlertCircle}>
            <p>
              In no event shall OSTtoPST.us, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your access to or use of or inability to access or use the service.</li>
              <li>Any conduct or content of any third party on the service.</li>
              <li>Any content obtained from the service.</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
            </ul>
          </Section>

          <Section title="Governing Law" icon={Scale}>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which the company is registered, without regard to its conflict of law provisions.
            </p>
          </Section>

          <div className="mt-16 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm">
              If you have any questions about these Terms & Conditions, please contact us at support@osttopst.us
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
