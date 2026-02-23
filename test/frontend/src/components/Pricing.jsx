import React from "react";
import {
  Check,
  X,
  Shield,
  CreditCard,
  Lock,
  Award,
  Globe,
  Share2,
  AtSign,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PricingCard = ({
  title,
  price,
  description,
  features,
  recommended,
  ctaText = "Buy Now",
}) => (
  <div
    className={`relative flex flex-col h-full p-8 bg-white rounded-xl shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-emerald-500/50 ${recommended ? "ring-2 ring-yellow-400 z-10" : ""}`}
  >
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
        Most Popular
      </div>
    )}

    <div className="mb-6 min-h-[100px]">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>

    <div className="mb-8">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black text-gray-900">${price}</span>
        <span className="text-gray-500 font-medium text-sm">/ license</span>
      </div>
    </div>

    <ul className="space-y-4 mb-8 flex-1">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          {feature.included ? (
            <div className="mt-0.5 min-w-[18px] text-green-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4.5 h-4.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          ) : (
            <div className="mt-0.5 min-w-[18px] text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4.5 h-4.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            </div>
          )}
          <span
            className={`text-sm ${feature.included ? "text-gray-700" : "text-gray-400 line-through"}`}
          >
            {feature.text}
          </span>
        </li>
      ))}
    </ul>

    <Button
      className={`w-full py-6 font-bold text-md rounded-md transition-colors ${recommended ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
    >
      {ctaText}
    </Button>
  </div>
);

const FooterColumn = ({ title, links }) => (
  <div className="space-y-4">
    <h4 className="font-bold text-white text-sm tracking-wide">{title}</h4>
    <ul className="space-y-2">
      {links.map((link, i) => (
        <li key={i}>
          <a
            href="#"
            className="text-gray-400 text-xs hover:text-white transition-colors"
          >
            {link}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const Pricing = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "Is the license a one-time payment or a subscription?",
      answer:
        "All our current licenses are one-time payments. You will receive a perpetual license for the version you purchase. Corporate and Technical plans also include lifetime free updates.",
    },
    {
      question: "How will I receive my license key?",
      answer:
        "License keys are delivered instantly via email once your payment is confirmed. Please check your inbox (and spam folder) within 5 minutes of your purchase.",
    },
    {
      question: "What is the 30-day money-back guarantee policy?",
      answer:
        "If the software fails to convert your OST file and our technical support team cannot resolve the issue within 48 hours, we will issue a full refund within 30 days of purchase.",
    },
    {
      question: "Can I upgrade my plan later?",
      answer:
        "Yes, you can upgrade from Personal to Corporate or Technical at any time by just paying the difference in price. Contact our support team for a custom upgrade link.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and wire transfers for Corporate and Technical licenses. All transactions are processed through secure, encrypted payment gateways.",
    },
    {
      question: "Do you offer a discount for non-profit organizations?",
      answer:
        "Yes, we highly value the work of non-profits. We offer a 30% discount on all our licenses for registered non-profit organizations and educational institutions. Please contact our sales team with your credentials.",
    },
  ];

  return (
    <div className="bg-gray-50 flex flex-col font-sans">
      <div className="bg-gray-50 pt-16 md:pt-28 pb-8 md:pb-12 text-center px-4">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 md:mb-6 tracking-tight leading-tight">
          Choose the Right Plan for Your
          <br />
          Needs
        </h1>
        <div className="relative inline-block">
          <p className="text-gray-500 font-medium max-w-2xl mx-auto text-sm md:text-base relative z-10">
            Trusted by IT professionals worldwide. All licenses come with a
            <br />
            <span className="text-emerald-600 font-semibold border-b-2 border-emerald-200/50">
              30-day money-back guarantee.
            </span>
          </p>
        </div>
      </div>

      {/* Pricing Cards Section */}
      <div className="max-w-7xl mx-auto px-4 w-full pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Personal Plan */}
          <PricingCard
            title="Personal"
            price="49"
            description="Perfect for individual users needing to recover their mailbox."
            features={[
              { text: "Basic conversion features", included: true },
              { text: "Single license (1 PC)", included: true },
              { text: "1-year technical support", included: true },
              { text: "No server migration", included: false },
            ]}
          />

          {/* Corporate Plan */}
          <PricingCard
            title="Corporate"
            price="199"
            description="Ideal for small to medium businesses and corporate offices."
            recommended={true}
            features={[
              { text: "Advanced conversion & filters", included: true },
              { text: "Multiple licenses (up to 10)", included: true },
              { text: "Priority support queue", included: true },
              { text: "Lifetime free updates", included: true },
              { text: "Commercial use license", included: true },
            ]}
          />

          {/* Technical Plan */}
          <PricingCard
            title="Technical"
            price="399"
            description="Best for IT administrators and large scale migrations."
            features={[
              { text: "Bulk conversion toolkit", included: true },
              { text: "Server/Admin license", included: true },
              { text: "24/7 Dedicated Support", included: true },
              {
                text: "Multiple output formats (EML, MSG, PDF)",
                included: true,
              },
            ]}
          />
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 md:gap-16 text-gray-500 grayscale opacity-80">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Secure SSL Checkout
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Visa / MasterCard / PayPal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Microsoft Certified Partner
            </span>
          </div>
        </div>
      </div>

      {/* Custom Solution Banner */}
      <div className="w-full bg-emerald-600 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Need a Custom Solution?
          </h2>
          <p className="text-emerald-50 max-w-2xl mx-auto leading-relaxed">
            For high-volume enterprise licenses, government agencies, or
            specific deployment requirements, our dedicated sales team is here
            to assist you with tailored pricing.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button
              variant="outline"
              className="border-2 border-emerald-400 text-white hover:bg-emerald-700 bg-transparent px-8 py-6 font-bold rounded-md"
            >
              Contact Sales
            </Button>
            <Button
              variant="outline"
              className="border-2 border-emerald-400 text-white hover:bg-emerald-700 bg-transparent px-8 py-6 font-bold rounded-md"
            >
              Request a Quote
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="w-full bg-white py-24 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
              Billing & Plans FAQ
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Transparent answers to common questions about our licensing and
              payments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {faqs.map((faq, index) => (
              <div key={index} className="space-y-3 group">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors flex items-start gap-3">
                  <span className="text-emerald-500 mt-1">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                  </span>
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed pl-8 text-sm md:text-base">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="bg-[#2B3544] text-gray-300 py-16 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              OST to PST Converter
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
              Industry-leading mailbox migration and recovery tools for IT
              professionals and individuals.
            </p>
          </div>

          <FooterColumn
            title="Product"
            links={[
              "Desktop Version",
              "Pricing Plans",
              "Release Notes",
              "Security",
            ]}
          />
          <FooterColumn
            title="Resources"
            links={[
              "Knowledge Base",
              "Video Tutorials",
              "User Manual",
              "Sitemap",
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              "About Us",
              "Privacy Policy",
              "Refund Policy",
              "Contact Support",
            ]}
          />
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-600">
          <p>
            © 2026 OST to PST Converter. All rights reserved. Microsoft and
            Outlook are trademarks of Microsoft Corp.
          </p>
          <div className="flex items-center gap-4">
            <Globe className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
            <Share2 className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
            <AtSign className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
