import React from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  HelpCircle, 
  CheckCircle, 
  FileText, 
  AlertCircle, 
  MessageSquare,
  ArrowRight
} from "lucide-react";

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
      <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight group-hover:text-brand-600 transition-colors uppercase">{title}</h2>
    </div>
    <div className="text-slate-600 leading-relaxed space-y-4 pl-2 border-l-2 border-slate-100 group-hover:border-brand-200 transition-colors ml-7 pr-4">
      {children}
    </div>
  </motion.section>
);

const RefundPolicy = () => {
  return (
    <div className="bg-[#fcfdfe] min-h-screen font-sans flex flex-col selection:bg-brand-100 selection:text-brand-900">
      {/* Premium Header */}
      <header className="relative bg-white pt-4 pb-20 px-4 text-center overflow-hidden border-b border-slate-100">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden text-brand-500/5 select-none" style={{ fontSize: '30rem', fontWeight: '900', lineHeight: '1' }}>
          REFUND
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-[0.2em] mb-8 border border-emerald-100">
              <CheckCircle className="w-3.5 h-3.5" />
              Customer Guarantee
            </span>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-none">
              Refund <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Policy</span>
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-xl font-medium leading-relaxed">
              We stand behind our software, but we also believe in a fair deal for both sides. When you purchase our tools, you’re agreeing to the terms laid out below.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="max-w-5xl mx-auto px-6 py-24 pb-40">
        <div className="bg-white rounded-[40px] p-8 md:p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative">
          
          <div className="absolute top-0 right-0 p-8 hidden md:block">
             <HelpCircle className="w-12 h-12 text-slate-50 opacity-[0.03]" />
          </div>

          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="mb-16 p-8 rounded-3xl bg-slate-50 border border-slate-100 text-slate-600 italic text-lg"
          >
            "Please take a minute to read them so we're on the same page. When we initiate a refund:"
          </motion.div>

          <Section title="1. The 30-Day Window" icon={CheckCircle} delay={0.1}>
            <p className="text-lg">
              We offer that Customers can apply for a refund within 30-days from the date of purchase.
            </p>
          </Section>

          <Section title="2. Try Before You Buy" icon={HelpCircle} delay={0.2}>
            <p className="text-lg mb-6">(Mandatory Demo)</p>
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-brand-50/50 border border-brand-100">
                <p className="text-slate-700 leading-relaxed">We provide a free trial version so you can test it on your actual files before spending on it.</p>
              </div>
              <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100">
                <p className="text-amber-900 font-medium">
                  <strong className="text-amber-950 font-black uppercase tracking-wider block mb-2">The Rule:</strong>
                  You must use the trial version to convert files, and if the files are not converted, then we will initiate a refund.
                </p>
              </div>
              <p className="text-sm text-slate-400 italic px-4">
                Note: If you do not use the trial version and directly buy the full version, then you are not eligible for a refund.
              </p>
            </div>
          </Section>

          <Section title="3. Let Us Fix It First" icon={MessageSquare} delay={0.3}>
            <p className="text-lg mb-6">Before we initiate a "refund", we need a chance to fix the problem. To be eligible for a refund, you must cooperate with our tech team:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-6 rounded-3xl border border-slate-100 bg-white hover:border-brand-300 transition-all group/card">
                 <h4 className="font-black text-slate-900 mb-3 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-brand-500" />
                   Online Help
                 </h4>
                 <p className="text-sm text-slate-500">You are required to permit our engineers to take a glance.</p>
               </div>
               <div className="p-6 rounded-3xl border border-slate-100 bg-white hover:border-brand-300 transition-all group/card">
                 <h4 className="font-black text-slate-900 mb-3 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-500" />
                   Sample Files
                 </h4>
                 <p className="text-sm text-slate-500">You have to send us some sample files, so we can see the reasons why the files are not able to convert.</p>
               </div>
            </div>
          </Section>

          <Section title="4. The Limitation" icon={AlertCircle} delay={0.4}>
            <div className="space-y-8">
              <div className="p-8 rounded-[32px] bg-red-50 border border-red-100">
                <p className="text-red-900 text-lg font-bold leading-relaxed">
                  If the software successfully converts <span className="underline decoration-red-300 decoration-4">40% or more</span> of the data, then in this case, no refund will be issued.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Service Deduction</span>
                  <h4 className="font-bold text-slate-900 mb-2">Processing Fee</h4>
                  <p className="text-sm text-slate-500">Every approved refund comes with a mandatory 10% deduction. This covers the bank fees and administrative costs we lose during the transaction.</p>
                </div>
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                   <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Key Activation</span>
                   <h4 className="font-bold text-slate-900 mb-2">No Mistake Refunds</h4>
                   <p className="text-sm text-slate-500">If you bought the incorrect product by mistake, and you’ve already used the activation key, we cannot give a refund.</p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="5. When We Say No" icon={Shield} delay={0.5}>
            <p className="text-lg mb-8">We don’t issue refunds if:</p>
            <ul className="space-y-4">
               {[
                 "You’ve already finished your conversion and just don't \"need\" the software anymore.",
                 "Your computer doesn’t meet the basic requirements we’ve listed on our site.",
                 "You only bought it for a one-time job, and now that it’s done, you want your money back.",
                 "You stop responding to our support team during the troubleshooting process."
               ].map((item, idx) => (
                 <li key={idx} className="flex gap-4 items-start p-5 rounded-2xl bg-slate-50/50 border border-slate-100 group/item hover:bg-white transition-colors">
                   <div className="mt-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover/item:border-brand-500 group-hover/item:text-brand-500 transition-all font-bold text-[10px] text-slate-400">
                     {idx + 1}
                   </div>
                   <span className="text-slate-600 font-medium">{item}</span>
                 </li>
               ))}
            </ul>
          </Section>

          {/* How to Start a Request */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-24 p-12 rounded-[48px] bg-slate-900 text-white relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
               <MessageSquare className="w-64 h-64" />
            </div>
            
            <div className="relative z-10 max-w-2xl">
              <h3 className="text-4xl font-black mb-6 tracking-tight">How to Start a Request?</h3>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                If things aren't working, email our support team with your <strong className="text-white">Order ID</strong>, a quick explanation of the error, and some screenshots of the issue. Our team will look into it and get back to you within business days.
              </p>
              
              <a 
                href="mailto:support@osttopst.us" 
                className="inline-flex items-center gap-4 px-10 py-5 bg-brand-600 rounded-full font-black text-lg hover:bg-brand-500 transition-all hover:gap-6 shadow-xl shadow-brand-500/20"
              >
                Submit Request
                <ArrowRight className="w-6 h-6" />
              </a>
            </div>
          </motion.div>

          <footer className="mt-24 pt-12 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm">
              Questions? Our legal team is here at{" "}
              <a href="mailto:support@osttopst.us" className="text-brand-600 font-bold hover:underline">
                support@osttopst.us
              </a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
