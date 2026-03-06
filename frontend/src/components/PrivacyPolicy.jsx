import React from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  ShieldCheck, 
  Users, 
  Clock, 
  Scale, 
  Cookie, 
  RefreshCw, 
  Mail 
} from "lucide-react";

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
        {Icon && <Icon className="w-6 h-6" />}
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
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col pt-20">
      {/* Header Section */}
      <header className="bg-gradient-to-b from-brand-50 to-slate-50 pt-8 pb-8 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div>
            <span className="inline-block bg-brand-100 text-brand-700 text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-8">
              Legal
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter capitalize">
              Privacy <span className="text-brand-500">Policy</span>
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
              Last updated: April 4, 2026. Your privacy is our priority.
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 pb-32">
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100">
          
          <Section title="1. Our Commitment to Privacy" icon={Shield}>
            <p>
              At osttopst.us, we take the privacy of our users seriously. We believe that protecting user data is our responsibility. So we design our systems and processes to collect the information we need to operate our software licensing and support services.
            </p>
            <p>
              We do not sell, trade, or misuse your data. Because this is something we're very serious about at osttopst.us.
            </p>
          </Section>

          <Section title="2. Information We Collect" icon={Eye}>
            <p>
              We only collect the information we need to operate our services. The information we collect is:
            </p>
            
            <div className="space-y-6 mt-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">2.1 Information You Provide</h3>
                <p className="mb-2">When you do things like:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Purchase a license</li>
                  <li>Contact support</li>
                  <li>Submit a query</li>
                </ul>
                <p className="mt-2">We may collect some information from you, including:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Your name</li>
                  <li>Your email address</li>
                  <li>Details about your transaction</li>
                  <li>Information you share with us when you contact us</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">2.2 Payment Processing</h3>
                <p>
                  When you make a payment on osttopst.us, it is processed securely through a third party like PayPal. Also, we do not collect your credit card details.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">2.3 Support Files & Technical Data</h3>
                <p>
                  If you send us files to help us troubleshoot a problem, our support team will only look at those files to fix the issue.
                </p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>We get rid of those files after thirty days.</li>
                  <li>We do not look at your files to get information about you.</li>
                  <li>We do not utilise your files for anything.</li>
                  <li>We do not share your files with anyone.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">2.4 Collected Data</h3>
                <p>When you visit osttopst.us, we may collect some technical information, such as:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Your IP address</li>
                  <li>What type of browser are you utilizing</li>
                  <li>What device are you using</li>
                  <li>What pages do you visit</li>
                  <li>When you visit</li>
                </ul>
                <p className="mt-2">
                  We use tools like Google Analytics to help us understand how people are using our website. This helps us make our website better and more secure.
                </p>
              </div>
            </div>
          </Section>

          <Section title="3. How We Use Information" icon={ShieldCheck}>
            <p>At osttopst.us, we only use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Give you the software you purchased</li>
              <li>Guide you with any problem you have</li>
              <li>Make our website better</li>
              <li>Keep our platform secure</li>
              <li>Do what we need to do for tax and legal reasons</li>
            </ul>
            <p className="mt-4">
              We do not send you spam, nor sell lists of email addresses, and we do not share your information with people who want to advertise to you.
            </p>
          </Section>

          <Section title="4. Data Protection & Security Measures" icon={Lock}>
            <p>We take the security of your data seriously at osttopst.us. We use security practices, such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Servers that are protected by firewalls</li>
              <li>Systems that only certain people can access</li>
              <li>Regular checks on our infrastructure</li>
              <li>Secure Hosting environments</li>
              <li>Controlling who can see your information</li>
            </ul>
          </Section>

          <Section title="5. Data Sharing Policy" icon={Users}>
            <p>At osttopst.us, we have a policy of not selling your data. We may share some information with people we work with, such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>PayPal</li>
              <li>The people who host our website</li>
              <li>The people who help us with analytics</li>
            </ul>
            <p className="mt-4 italic">These people only use your data to do their jobs.</p>
          </Section>

          <Section title="6. Data Retention" icon={Clock}>
            <p>We only keep your data for as long as we need to.</p>
            <p className="mt-2 font-medium">For example:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We keep records of transactions for seven years in case we need them for tax or legal reasons.</li>
              <li>We get rid of support files thirty days after we fix the issue.</li>
              <li>We keep records of our conversations with you as long as we need to to make sure we can keep helping you.</li>
            </ul>
            <p className="mt-4">When we do not need your data anymore, we get rid of it securely.</p>
          </Section>

          <Section title="7. Your Data Protection Rights" icon={Scale}>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>See what information we have about you</li>
              <li>Correct any wrong information</li>
              <li>Ask us to delete your information</li>
              <li>Ask us what details we have about you</li>
            </ul>
            <p className="mt-4">
              To do any of these things, you can contact <a href="mailto:support@OSTTOPST.com" className="text-brand-600 hover:underline">support@OSTTOPST.com</a>. We will get back to you within a reasonable amount of time.
            </p>
          </Section>

          <Section title="8. Cookies" icon={Cookie}>
            <p>
              Cookies are small files that a website or its service provider downloads to a desktop's hard drive via a web browser. It enables the website system to find the browser and remember the information. We also use cookies to guide us in compiling collective data about website traffic and interaction so that we can provide better services in the future.
            </p>
            <p className="mt-2 font-medium">We use cookies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Make our website work</li>
              <li>Remember what you like</li>
              <li>See how people are utilizing our website</li>
            </ul>
            <p className="mt-4">
              You can turn off cookies in your browser, but some things on our website might not work right.
            </p>
          </Section>

          <Section title="9. Policy Updates" icon={RefreshCw}>
            <p>
              We may change this Privacy Policy sometimes to reflect changes in our operations or the law. When we do a certain update, we will post the version on this page with a new effective date.
            </p>
          </Section>

          <Section title="10. Contact Us" icon={Mail}>
            <p>
              If you have any questions or queries about the privacy policy, please contact us at <a href="https://osttopst.us/" className="text-brand-600 hover:underline">https://osttopst.us/</a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
