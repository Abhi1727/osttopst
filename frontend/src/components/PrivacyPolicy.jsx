import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileText } from "lucide-react";

const Section = ({ title, icon: Icon, children }) => (
  <motion.section 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
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
  </motion.section>
);

const PrivacyPolicy = () => {
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
              Privacy <span className="text-brand-500">Policy</span>
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
              Last updated: March 14, 2026. Your privacy is our priority.
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 pb-32">
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100">
          
          <Section title="Information We Collect" icon={Eye}>
            <p>
              At OSTtoPST.us, we collect only the minimum information necessary to provide our services. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Data:</strong> Email address (if provided for account creation or support).</li>
              <li><strong>Technical Data:</strong> IP address, browser type, and operating system for security and performance monitoring.</li>
              <li><strong>Temporary Files:</strong> The OST files you upload are processed locally or on our secure servers temporarily and are deleted immediately after conversion or after a short period if you choose to store them.</li>
            </ul>
          </Section>

          <Section title="How We Use Your Data" icon={Shield}>
            <p>
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our conversion service.</li>
              <li>To notify you about changes to our service.</li>
              <li>To provide customer support.</li>
              <li>To gather analysis or valuable information so that we can improve our service.</li>
              <li>To monitor the usage of our service and detect, prevent and address technical issues.</li>
            </ul>
          </Section>

          <Section title="Data Security" icon={Lock}>
            <p>
              The security of your data is important to us. We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All file transfers are encrypted using SSL/TLS protocols.</li>
              <li>Files are automatically deleted from our servers after the conversion process is complete.</li>
              <li>We never sell or share your personal data with third parties for marketing purposes.</li>
            </ul>
          </Section>

          <Section title="Cookie Policy" icon={FileText}>
            <p>
              We use cookies and similar tracking technologies to track the activity on our service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier.
            </p>
            <p>
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </Section>

          <Section title="Changes to This Policy" icon={FileText}>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>
            <p>
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </Section>

          <div className="mt-16 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm">
              If you have any questions about this Privacy Policy, please contact us at support@osttopst.us
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
