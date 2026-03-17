import React from "react";
import {
  Search,
  Ticket,
  MessageSquare,
  Book,
  Mail,
  MapPin,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SupportCard = ({
  icon: Icon,
  title,
  description,
  linkText,
  linkUrl,
  badge,
}) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
    {badge && (
      <span className="absolute top-4 right-4 bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-brand-100">
        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span>
        {badge}
      </span>
    )}
    <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-100 transition-colors">
      <Icon className="w-6 h-6 text-brand-600" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1">
      {description}
    </p>
    <a
      href={linkUrl}
      className="text-brand-600 font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all"
    >
      {linkText} <ArrowRight className="w-4 h-4" />
    </a>
  </div>
);

const Support = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <div className="pt-20 pb-16 px-4 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">
          How can we <span className="text-brand-600">help?</span>
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto mb-10">
          Search for error codes, tutorials, and configuration guides to get
          your conversion started instantly.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for articles, error codes, or FAQs..."
              className="w-full pl-12 pr-32 py-4 rounded-full border-none shadow-lg shadow-slate-200/50 focus:ring-2 focus:ring-brand-500/20 text-slate-700 bg-white"
            />
            <Button className="absolute right-2 top-2 bottom-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full px-6">
              Search
            </Button>
          </div>
        </div>

        {/* Popular Topics */}
        <div className="flex flex-wrap justify-center gap-2 text-xs font-medium text-slate-400">
          <span>Popular:</span>
          <a href="#" className="text-brand-600 hover:underline">
            License Recovery
          </a>
          <span>•</span>
          <a href="#" className="text-brand-600 hover:underline">
            Outlook Error 0x8004010F
          </a>
          <span>•</span>
          <a href="#" className="text-brand-600 hover:underline">
            Batch Conversion
          </a>
        </div>
      </div>

      {/* Support Options Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SupportCard
            icon={Ticket}
            title="Submit a Ticket"
            description="Detailed technical assistance for specific issues. Average response time: 24h."
            linkText="Open Ticket"
            linkUrl="#"
          />
          <SupportCard
            icon={MessageSquare}
            title="Live Chat"
            description="Immediate help from our support specialists. Best for quick troubleshooting."
            linkText="Start Chat"
            linkUrl="#"
            badge="Online"
          />
          <SupportCard
            icon={Book}
            title="Knowledge Base"
            description="Self-service portal with 500+ articles, videos, and step-by-step guides."
            linkText="Browse Docs"
            linkUrl="#"
          />
        </div>
      </div>

      {/* Support Process Section */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How does our Support Process Work?
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              We follow a streamlined 4-step process to ensure your issues are resolved quickly and efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Submit Ticket",
                desc: "First, submit your problem or ticket.",
              },
              {
                step: "02",
                title: "Analysis",
                desc: "Second, our technical team analyzes the issue.",
              },
              {
                step: "03",
                title: "Troubleshooting",
                desc: "Third, you will get a detailed troubleshooting guide.",
              },
              {
                step: "04",
                title: "Live Support",
                desc: "If required, we schedule an online support session.",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-5xl font-black text-brand-600 mb-4 select-none text-center">
                  {item.step}
                </div>
                <div className="relative -mt-8 pt-2">
                  <h4 className="text-lg font-bold text-slate-800 mb-2 text-center">
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-sm leading-relaxed text-center">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Column: Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Contact Us Directly
              </h2>
              <p className="text-slate-500 leading-relaxed">
                Can't find what you're looking for? Send us a message and our
                team will get back to you as soon as possible. We offer premium
                support for business license holders.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Email Support
                  </p>
                  <p className="font-bold text-slate-800">
                    support@osttopstconverter.us
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Office
                  </p>
                  <p className="font-bold text-slate-800">30N Gould St Ste R, Sheridan, WY 82802</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-slate-100">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    Full Name
                  </label>
                  <Input
                    placeholder="Enter your name"
                    className="bg-slate-50 border-slate-200 focus:bg-white h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    Email Address
                  </label>
                  <Input
                    placeholder="Enter your email"
                    className="bg-slate-50 border-slate-200 focus:bg-white h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  Subject
                </label>
                <div className="relative">
                  <select className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none appearance-none text-sm">
                    <option>Technical Support</option>
                    <option>Sales Inquiry</option>
                    <option>Billing Issue</option>
                    <option>Feature Request</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  Your Message
                </label>
                <textarea
                  className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm resize-none"
                  placeholder="How can we help you today?"
                ></textarea>
              </div>

              <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold h-12 text-md shadow-lg shadow-brand-600/20">
                Send Message
              </Button>

              <p className="text-[10px] text-center text-slate-400 leading-relaxed px-4">
                By submitting this form, you agree to our Privacy Policy and
                Terms & Service. We process your data to respond to your
                request.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
