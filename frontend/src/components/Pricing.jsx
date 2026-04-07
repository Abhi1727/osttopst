import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Lock,
  Award,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import licenseService from "@/services/licenseService";
import { toast } from "sonner";

const comparisonFeatures = [
  {
    name: "Full OST to PST Conversion",
    demo: "Basic Only",
    professional: true,
  },
  {
    name: "Repair Corrupted OST Files",
    demo: "Limited",
    professional: true,
  },
  {
    name: "Cloud Priority",
    demo: "Standard",
    professional: "Priority",
  },
  {
    name: "File Formats",
    demo: "Standard",
    professional: "All 16+",
  },
  {
    name: "Technical Support",
    demo: "Community",
    professional: "Email",
  },
  {
    name: "Bulk Conversion",
    demo: false,
    professional: "Yes",
  },
  {
    name: "Commercial Use",
    demo: false,
    professional: "Yes",
  },
  {
    name: "Number of PCs / Licenses",
    demo: "1",
    professional: "1",
  },
];

const toolComparison = [
  {
    feature: "OST Size Limit",
    others: "5-20 GB",
    ours: "5GB",
  },
  {
    feature: "Cloud Conversion",
    others: "No",
    ours: "Yes",
  },
  {
    feature: "Damage Repair",
    others: "Limited",
    ours: "Upgraded",
  },
  {
    feature: "Price",
    others: "More than $299",
    ours: "Begins at $49",
  },
];

const formatStatusStorage = (bytes) => {
  if (bytes === -1) return "Unlimited";
  if (!bytes) return "0 GB";
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
};

const CheckIcon = ({ highlighted }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

const PricingCard = ({
  title,
  price,
  description,
  features,
  recommended,
  ctaText = "Buy Now",
  isActive = false,
  onClick,
  isLoading = false,
}) => (
  <div className={`relative flex flex-col h-full rounded-2xl transition-all duration-300 ${
    recommended
      ? "bg-brand-600 shadow-2xl shadow-brand-500/30 scale-[1.03] z-10"
      : "bg-white border border-gray-200 shadow-md hover:shadow-xl hover:-translate-y-1"
  } ${isActive && !recommended ? "ring-2 ring-brand-500" : ""}`}>

    {/* Popular badge */}
    {recommended && (
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-[0.15em] shadow-md whitespace-nowrap">
        Most Popular
      </div>
    )}

    {/* Current plan badge */}
    {isActive && (
      <div className={`absolute -top-3.5 right-4 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md ${
        recommended ? "bg-white text-brand-600" : "bg-brand-500 text-white"
      }`}>
        Current Plan
      </div>
    )}

    <div className={`p-8 pb-6 border-b ${ recommended ? "border-white/20" : "border-gray-100" }`}>
      <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${ recommended ? "text-brand-200" : "text-brand-500" }`}>
        {title}
      </p>
      <div className="flex items-end gap-1.5 mb-3">
        <span className={`text-5xl font-black tracking-tight ${ recommended ? "text-white" : "text-gray-900" }`}>
          ${price}
        </span>
        <span className={`mb-2 text-sm font-medium ${ recommended ? "text-brand-200" : "text-gray-400" }`}>
          / license
        </span>
      </div>
      <p className={`text-sm leading-relaxed ${ recommended ? "text-brand-100" : "text-gray-500" }`}>
        {description}
      </p>
    </div>

    <ul className="px-8 py-6 space-y-3.5 flex-1">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-3">
          <span className={feature.included
            ? (recommended ? "text-yellow-300" : "text-brand-500")
            : (recommended ? "text-brand-400" : "text-gray-300")
          }>
            {feature.included ? <CheckIcon /> : <XIcon />}
          </span>
          <span className={`text-sm ${
            feature.included
              ? (recommended ? "text-white" : "text-gray-700")
              : (recommended ? "text-brand-300 line-through" : "text-gray-400 line-through")
          }`}>
            {feature.text}
          </span>
        </li>
      ))}
    </ul>

    <div className="px-8 pb-8">
      <Button
        disabled={isLoading}
        onClick={onClick}
        className={`w-full py-6 font-bold text-sm rounded-xl transition-all duration-200 ${
          recommended
            ? "bg-white text-brand-700 hover:bg-brand-50 shadow-lg"
            : "bg-brand-600 hover:bg-brand-700 text-white"
        }`}
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : ctaText}
      </Button>
    </div>
  </div>
);

const FooterColumn = ({ title, links }) => (
  <div className="space-y-4">
    <h4 className="font-bold text-white text-sm tracking-wide">{title}</h4>
    <ul className="space-y-2">
      {links.map((link, i) => (
        <li key={i}>
          <a
            href={link.href || "#"}
            className="text-gray-400 text-xs hover:text-white transition-colors"
          >
            {link.label || link}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const Pricing = () => {
  const navigate = useNavigate();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [status, setStatus] = useState(null);
  const [purchasingPlan, setPurchasingPlan] = useState(null);

  const fetchStatus = async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      const email = user?.primaryEmailAddress?.emailAddress;
      const data = await licenseService.getLicenseStatus(token, email);
      setStatus(data);

      // Check for usage restriction and show popup
      if (data && (data.isUsageRestricted || data.IsUsageRestricted)) {
        toast.warning("Usage Limit Reached", {
          description:
            "You have reached your plan's usage limits. Please upgrade your plan or contact support to continue.",
          duration: 10000,
          action: {
            label: "Upgrade Now",
            onClick: () => {
              const el = document.getElementById("pricing-slider");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            },
          },
        });
      }
      return data;
    } catch (error) {
      console.error("Failed to load license in Pricing", error);
      return null;
    }
  };

  const handlePurchase = async (moduleId, basePrice, planNumber) => {
    if (!isSignedIn) {
      toast.error("Please sign in to purchase a plan", {
        description: "You need an account to manage your licenses.",
      });
      return;
    }

    setPurchasingPlan(planNumber);
    try {
      const token = await getToken();
      const email = user?.primaryEmailAddress?.emailAddress;

      const requestData =
        planNumber === 0
          ? {
              TotalItems: 1,
              Storage: 500 * 1024 * 1024, // 500 MB
              TotalDays: 7,
              ModuleId: 1, // Free/Demo
            }
          : {
              TotalItems: 1,
              Storage: 5 * 1024 * 1024 * 1024, // 5 GB
              TotalDays: 365,
              ModuleId: moduleId, // Professional
            };

      const response = await licenseService.generateSubscriptionRequest(
        token,
        requestData,
        email,
      );

      if (response?.success) {
        const allotted = response.allottedData ?? response.AllottedData;
        
        if (allotted) {
          const totalItemsVal = allotted?.totalItemsAllotted ?? allotted?.TotalItemsAllotted;
          const totalDaysVal = allotted?.totalDaysAllotted ?? allotted?.TotalDaysAllotted;
          const totalStorageVal = allotted?.totalStorageAllotted ?? allotted?.TotalStorageAllotted;

          const itemsText = totalItemsVal === -1 ? "Unlimited" : (totalItemsVal?.toLocaleString() ?? requestData.TotalItems);
          const daysText = totalDaysVal === -1 ? "Unlimited" : (totalDaysVal ?? requestData.TotalDays);
          
          toast.success("Plan Allotted Successfully!", {
            description: `Backend confirms: ${itemsText} items, ${formatStatusStorage(totalStorageVal ?? requestData.Storage)} Storage allotted for ${daysText} days.`,
          });
        } else {
          toast.success("Subscription request generated!", {
            description: response.message || "Your request is being processed. It will be verified by the admin.",
          });
        }
        
        // Refetch status locally and tell the header badge to refresh too
        const newData = await fetchStatus();
        
        // Explicitly check for limit if it wasn't caught in fetchStatus's effect
        if (newData && (newData.isUsageRestricted || newData.IsUsageRestricted)) {
           // The toast is already in fetchStatus, but we can add a specific one here if we want immediate feedback
           // after the purchase request was "blindly" sent.
        }
        
        window.dispatchEvent(new Event("license-refresh"));
      } else if (response) {
        toast.error("Subscription request failed", {
          description: response.message || "There was an error processing your request.",
        });
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to initiate purchase", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setPurchasingPlan(null);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [isLoaded, isSignedIn, getToken, user]);

  const tierLower = String(status?.tier ?? status?.Tier ?? "").toLowerCase();
  const isProfessional = tierLower === "professional" || tierLower === "3";

  const faqs = [
    {
      question: "When do I get my license?",
      answer: "Licenses are delivered instantly via email after your payment is successfully processed. Please check your inbox (and spam folder) within 5 minutes.",
    },
    {
      question: "Can I upgrade my plan at any time?",
      answer: "Yes, you can upgrade your plan at any time through your user dashboard. You'll only need to pay the difference between your current plan and the new one.",
    },
    {
      question: "What are the payment methods?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and more. All transactions are processed through secure, encrypted payment gateways.",
    },
    {
      question: "Is there a money-back guarantee?",
      answer: "Yes, all our paid licenses come with a 30-day money-back guarantee if the software fails to meet the technical conversion requirements.",
    },
  ];

  return (
    <div className="bg-gray-50 flex flex-col font-sans min-h-screen">
      {/* Hero Section Container */}
      <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center py-4 md:py-8">
        <div className="bg-gray-50 pt-1 md:pt-2 pb-6 text-center px-4 w-full">
        <h1 className="mb-2">
          Choose the <span className="header-text-gradient">Right Plan</span>{" "}
          for Your Needs
        </h1>
        <div className="relative inline-block mt-2">
          <p className="text-gray-500 font-medium max-w-2xl mx-auto relative z-10">
            Trusted by IT professionals worldwide. All licenses come with a
            <span className="text-brand-600 font-semibold ml-1">
              30-day money-back guarantee.
            </span>
          </p>
        </div>
      </div>


      {/* Pricing Cards Section */}
      <div className="max-w-5xl mx-auto px-4 w-full pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

          {/* Demo Plan */}
          <PricingCard
            title="Demo"
            price={0}
            description="Perfect for a quick trial and small file conversions."
            isLoading={purchasingPlan === 0}
            onClick={() => handlePurchase(1, 0, 0)}
            ctaText="Start Free Trial"
            features={[
              { text: "Full OST to PST conversion", included: true },
              { text: "1 OST File", included: true },
              { text: "500 MB Storage limit", included: true },
              { text: "7 Days Validity", included: true },
              { text: "Priority Support", included: false },
            ]}
          />

          {/* Professional Plan */}
          <PricingCard
            title="Professional"
            price={49}
            description="Everything you need for a complete recovery."
            recommended={true}
            isActive={isProfessional}
            isLoading={purchasingPlan === 1}
            onClick={() => handlePurchase(1, 49, 1)}
            features={[
              { text: "Full OST to PST conversion", included: true },
              { text: "1 OST File", included: true },
              { text: "5 GB Storage limit", included: true },
              { text: "365 Days Validity", included: true },
              { text: "Email Support", included: true },
            ]}
          />

          {/* Desktop Plan */}
          <PricingCard
            title="Desktop"
            price={98}
            description="For power users needing maximum local storage and speed."
            isLoading={purchasingPlan === 2}
            onClick={() => handlePurchase(2, 98, 2)}
            ctaText="Get Desktop"
            features={[
              { text: "Full OST to PST conversion", included: true },
              { text: "Unlimited OST Files", included: true },
              { text: "More than 5 GB Storage", included: true },
              { text: "365 Days Validity", included: true },
              { text: "Priority Email Support", included: true },
            ]}
          />
        </div>
      </div>

      {/* Trust Badges Bar */}
      <div className="w-full bg-white border-y border-gray-100 py-2 mb-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center items-center gap-6 md:gap-10 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-1.5 group cursor-default">
            <Lock className="w-3.5 h-3.5 text-brand-600 group-hover:scale-110 transition-transform" />
            <span>Secure SSL Checkout</span>
          </div>
          <div className="flex items-center gap-1.5 group cursor-default">
            <CreditCard className="w-3.5 h-3.5 text-brand-600 group-hover:scale-110 transition-transform" />
            <span>Visa / MasterCard / PayPal</span>
          </div>
          <div className="flex items-center gap-1.5 group cursor-default">
            <Award className="w-3.5 h-3.5 text-brand-600 group-hover:scale-110 transition-transform" />
            <span>Microsoft Certified Partner</span>
          </div>
        </div>
      </div>
    </div>

      {/* Custom Solution Banner */}
      <div className="w-full bg-brand-600 py-10 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-white">
            Need a Custom Solution?
          </h2>
          <p className="text-brand-50 max-w-2xl mx-auto leading-relaxed">
            For high-volume enterprise licenses, government agencies, or
            specific deployment requirements, our dedicated sales team is here
            to assist you with tailored pricing.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button
              variant="outline"
              className="border-2 border-brand-400 text-white hover:bg-brand-700 bg-transparent px-8 py-6 font-bold rounded-md"
              onClick={() => navigate("/contact-us")}
            >
              Contact Sales
            </Button>
            <Button
              variant="outline"
              className="border-2 border-brand-400 text-white hover:bg-brand-700 bg-transparent px-8 py-6 font-bold rounded-md"
              onClick={() => navigate("/contact-us")}
            >
              Request a Quote
            </Button>
          </div>
        </div>
      </div>

      {/* Comparison Table Section */}
      <div className="w-full bg-white pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className=" rounded-t-lg py-10 px-4">
            <h2 className="text-center mb-4">
              Compare All Plans{" "}
              <span className="text-brand-600">Side by Side</span>
            </h2>
            <p className="text-gray-500 text-sm text-center max-w-xl mx-auto">
              Not sure which OST to PST converter license is right for you?
              Here's a clear breakdown of what each plan includes.
            </p>
          </div>

          <div className="overflow-x-auto ">
            <table className="w-full text-left border-collapse min-w-[600px] text-sm md:text-base">
              <thead>
                <tr>
                  <th className="p-4 bg-slate-800 text-white font-medium w-[40%]">
                    Feature
                  </th>
                  <th className="p-4 bg-slate-700 text-white text-center font-medium border-l border-white/20 w-[30%]">
                    <div>Demo</div>
                    <div className="text-xs font-normal opacity-90">$0</div>
                  </th>
                  <th className="p-4 bg-brand-600 text-white text-center font-bold border-l border-brand-500 w-[30%] shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
                    <div>Professional</div>
                    <div className="text-xs font-normal opacity-90">$49</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-x border-b border-gray-100">
                {comparisonFeatures.map((feature, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4 text-gray-600 font-medium">
                      {feature.name}
                    </td>
                    <td className="p-4 text-center bg-gray-50/30">
                      {feature.demo === true ? (
                        <span className="text-brand-500 font-bold text-lg leading-none">
                          ✓
                        </span>
                      ) : feature.demo === false ? (
                        <span className="text-gray-300 font-bold text-lg leading-none">
                          ✕
                        </span>
                      ) : (
                        <div className="text-xs text-gray-500 font-medium">
                          {feature.demo}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center bg-brand-50/20">
                      {feature.professional === true ? (
                        <span className="text-brand-600 font-bold text-lg leading-none">
                          ✓
                        </span>
                      ) : feature.professional === false ? (
                        <span className="text-brand-200 font-bold text-lg leading-none">
                          ✕
                        </span>
                      ) : (
                        <div className="text-xs text-brand-700 font-bold">
                          {feature.professional}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Why Our Pricing is Better - Tool Comparison */}
      <div className="w-full bg-gray-50 py-20 px-4 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4">
              Why is our <span className="text-brand-600">Pricing better?</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We offer premium enterprise features at a fraction of the cost of
              traditional tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            {/* Header */}
            <div className="hidden md:contents">
              <div className="p-6 bg-slate-50 border-b border-gray-200 font-bold text-slate-800">
                Features
              </div>
              <div className="p-6 bg-slate-50 border-b border-l border-gray-200 font-bold text-slate-800 text-center">
                Other Tools
              </div>
              <div className="p-6 bg-brand-50 border-b border-l border-brand-100 font-bold text-brand-700 text-center">
                Our Tools
              </div>
            </div>

            {toolComparison.map((item, index) => (
              <React.Fragment key={index}>
                {/* Mobile Labels */}
                <div className="md:hidden p-4 bg-slate-50 font-bold text-slate-800 border-t border-gray-200 first:border-t-0">
                  {item.feature}
                </div>

                {/* Desktop/Row Layout */}
                <div className="p-6 border-b border-gray-100 last:md:border-b-0 hidden md:block text-gray-600 font-medium">
                  {item.feature}
                </div>
                <div className="p-6 border-b border-l border-gray-100 last:md:border-b-0 text-center text-gray-400">
                  <span className="md:hidden font-semibold text-gray-500 mr-2">
                    Other Tools:
                  </span>
                  {item.others}
                </div>
                <div className="p-6 border-b border-l border-brand-50 bg-brand-50/30 last:md:border-b-0 text-center font-bold text-brand-600">
                  <span className="md:hidden font-semibold text-brand-700 mr-2">
                    Our Tools:
                  </span>
                  {item.ours}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full bg-white py-24 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="mb-4">
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
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors flex items-start gap-3">
                  <span className="text-brand-500 mt-1">
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

     
    </div>
  );
};

export default Pricing;