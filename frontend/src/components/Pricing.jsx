import React, { useState, useEffect } from "react";
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
    personal: true,
    corporate: true,
    technical: true,
  },
  {
    name: "Repair Corrupted OST Files",
    personal: true,
    corporate: true,
    technical: true,
  },
  {
    name: "PST Splitting (Oversized Files)",
    personal: false,
    corporate: true,
    technical: true,
  },
  {
    name: "Deduplication logic",
    personal: false,
    corporate: true,
    technical: true,
  },
  {
    name: "Direct Cloud Migration",
    personal: false,
    corporate: false,
    technical: true,
  },
  {
    name: "Data Retention / Auto-Cleanup",
    personal: "6 Hours",
    corporate: "6 Hours",
    technical: "6 Hours",
  },
  {
    name: "Number of PCs / Licenses",
    personal: "1 PC",
    corporate: "Up to 10 PCs",
    technical: "Unlimited (Server)",
  },
  {
    name: "Advanced Filters (Date, Folder, Size)",
    personal: false,
    corporate: true,
    technical: true,
  },
  {
    name: "Batch Conversion (Multiple OST Files)",
    personal: false,
    corporate: true,
    technical: true,
  },
  {
    name: "Multiple Output Formats (EML, MSG, PDF)",
    personal: false,
    corporate: false,
    technical: true,
  },
  {
    name: "24/7 Dedicated Support",
    personal: false,
    corporate: false,
    technical: true,
  },
  {
    name: "30-Day Money-Back Guarantee",
    personal: true,
    corporate: true,
    technical: true,
  },
];

const toolComparison = [
  {
    feature: "OST Size Limit",
    others: "5-20 GB",
    ours: "50 GB",
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
  if (!bytes) return "0 GB";
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
};

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
  activeDetails = null,
}) => (
  <div
    className={`relative flex flex-col h-full p-8 bg-white rounded-xl shadow-lg border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${isActive ? "border-brand-500 ring-2 ring-brand-500/20" : "border-gray-200"} ${recommended ? "ring-2 ring-yellow-400 z-10" : ""}`}
  >
    {isActive && (
      <div className="absolute -top-4 right-4 bg-brand-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg animate-bounce">
        Current Plan
      </div>
    )}
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
        Most Popular
      </div>
    )}

    <div className="mb-6 min-h-[100px]">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
      {isActive && activeDetails && (
        <div className="mt-2 text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded border border-brand-100 animate-pulse">
          ACTIVE: {activeDetails}
        </div>
      )}
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
            <div className="mt-0.5 min-w-[18px] text-brand-500">
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
      disabled={isActive || isLoading}
      onClick={onClick}
      className={`w-full py-6 font-bold text-md rounded-md transition-colors ${isActive ? "bg-brand-100 text-brand-600 border-brand-200 cursor-default" : "bg-brand-600 hover:bg-brand-700 text-white"}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isActive ? (
        "Active Plan"
      ) : (
        ctaText
      )}
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

  // Dynamic pricing details state
  const [totalItems, setTotalItems] = useState(1000);
  const [storageGB, setStorageGB] = useState(50);
  const [totalDays, setTotalDays] = useState(365);

  const calculateFinalPrice = (basePrice) => {
    if (basePrice === 0) return 0;
    const itemCost = (totalItems / 100) * 2; // $2 per 1000 items
    const storageCost = storageGB * 0.2; // $0.2 per GB
    const dayRatio = totalDays / 365;
    return Math.round((basePrice + itemCost + storageCost) * dayRatio);
  };

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
    } catch (error) {
      console.error("Failed to load license in Pricing", error);
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

      const requestData = {
        TotalItems: totalItems,
        Storage: storageGB * 1024 * 1024 * 1024, // Convert GB to Bytes
        TotalDays: totalDays,
        ModuleId: moduleId,
      };

      const response = await licenseService.generateSubscriptionRequest(
        token,
        requestData,
        email,
      );

      if (response?.success) {
        toast.success("Plan Allotted Successfully!", {
          description: `Backend confirms: ${response.allottedData?.totalItemsAllotted?.toLocaleString()} items, ${formatStatusStorage(response.allottedData?.totalStorageAllotted)} Storage allotted for ${response.allottedData?.totalDaysAllotted} days.`,
        });
        // Refetch updated status from backend
        fetchStatus();
      } else if (response) {
        toast.success("Subscription request generated!", {
          description: response.message || "Your request is being processed.",
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
    <div className="bg-gray-50 flex flex-col font-sans min-h-screen">
      {/* Hero Section Container */}
      <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center py-4 md:py-8">
        <div className="bg-gray-50 pt-1 md:pt-2 pb-6 text-center px-4 w-full">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 mb-0 tracking-tight leading-tight">
          Choose the <span className="header-text-gradient">Right Plan</span>{" "}
          for Your Needs
        </h1>
        <div className="relative inline-block">
          <p className="text-gray-500 font-medium max-w-2xl mx-auto text-[10px] relative z-10 leading-tight">
            Trusted by IT professionals worldwide. All licenses come with a
            <span className="text-brand-600 font-semibold ml-1">
              30-day money-back guarantee.
            </span>
          </p>
        </div>
      </div>

      {/* Customization Section */}
      <div className="max-w-4xl mx-auto px-4 w-full mb-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 md:px-4 md:py-2">
          <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-7 h-7 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </span>
            Customize Your Requirements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex justify-between">
                OST File Limit
                <span className="text-brand-600 font-bold">
                  {totalItems} Files
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={totalItems}
                onChange={(e) => setTotalItems(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                <span>1 File</span>
                <span>50 Files</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex justify-between">
                Storage (GB)
                <span className="text-brand-600 font-bold">{storageGB} GB</span>
              </label>
              <input
                type="range"
                min="1"
                max="1000"
                step="1"
                value={storageGB}
                onChange={(e) => setStorageGB(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                <span>0 GB</span>
                <span>1000 GB</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex justify-between">
                Validity (Days)
                <span className="text-brand-600 font-bold">
                  {totalDays} Days
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="1095"
                step="30"
                value={totalDays}
                onChange={(e) => setTotalDays(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                <span>30D</span>
                <span>3 Years</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards Section */}
      <div className="max-w-7xl mx-auto px-4 w-full pb-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-4 max-w-6xl mx-auto">
          {/* Personal Plan */}
          <PricingCard
            title="Personal"
            price={calculateFinalPrice(49)}
            description="Perfect for individual users needing to recover their mailbox."
            isLoading={purchasingPlan === 1}
            onClick={() => handlePurchase(1, 49, 1)}
            features={[
              { text: "Core OST to PST conversion", included: true },
              { text: "Single license (1 PC)", included: true },
              { text: "Repair corrupted headers", included: true },
              { text: "6-hour data retention", included: true },
              { text: "No Bulk Split / Migration", included: false },
            ]}
          />

          {/* Corporate Plan - Mapped to 'Professional' in simple license API for now */}
          <PricingCard
            title="Corporate"
            price={calculateFinalPrice(199)}
            description="Ideal for small to medium businesses and corporate offices."
            recommended={true}
            isActive={isProfessional}
            isLoading={purchasingPlan === 2}
            activeDetails={
              isProfessional ? (
                <div className="flex flex-col gap-1">
                  <div>{`UPLOADED: ${(status.totalItemsUsed ?? status.TotalItemsUsed)?.toLocaleString()} / ${(status.totalItemsAllotted ?? status.TotalItemsAllotted)?.toLocaleString()} OST Files`}</div>
                  <div>{`STORAGE: ${formatStatusStorage(status.totalStorageUsed ?? status.TotalStorageUsed)} / ${formatStatusStorage(status.totalStorageAllotted ?? status.TotalStorageAllotted)} Storage Used`}</div>
                  {(status.isUsageRestricted ||
                    status.IsUsageRestricted ||
                    status.hitFileCountLimit ||
                    status.HitFileCountLimit ||
                    status.hitSizeLimit ||
                    status.HitSizeLimit) && (
                    <div className="text-red-600 font-black text-[9px] mt-1 bg-red-50 p-1 rounded border border-red-200">
                      LIMIT REACHED!
                    </div>
                  )}
                </div>
              ) : null
            }
            onClick={() => handlePurchase(1, 199, 2)}
            features={[
              { text: "Advanced conversion & filters", included: true },
              { text: "PST Splitting & Deduplication", included: true },
              { text: "Multiple licenses (up to 10)", included: true },
              { text: "Priority support queue", included: true },
              { text: "6-hour safe cleanup", included: true },
              { text: "Commercial use license", included: true },
            ]}
          />

          {/* Technical Plan */}
          <PricingCard
            title="Technical"
            price={calculateFinalPrice(399)}
            description="Best for IT administrators and large scale migrations."
            isLoading={purchasingPlan === 3}
            onClick={() => handlePurchase(1, 399, 3)}
            features={[
              { text: "Bulk conversion & Cloud Migration", included: true },
              { text: "Server/Admin license (Unlimited)", included: true },
              { text: "24/7 Dedicated Support", included: true },
              { text: "PST Split, Dedup & Repair", included: true },
              {
                text: "Multiple formats (EML, MSG, PDF)",
                included: true,
              },
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
          <h2 className="text-3xl font-bold text-white">
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
            >
              Contact Sales
            </Button>
            <Button
              variant="outline"
              className="border-2 border-brand-400 text-white hover:bg-brand-700 bg-transparent px-8 py-6 font-bold rounded-md"
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
            <h2 className="text-5xl font-bold text-slate-800 text-center mb-2 tracking-tight">
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
                  <th className="p-4 bg-slate-800 text-white text-center font-medium border-l border-white/20 w-[20%]">
                    <div>Personal</div>
                    <div className="text-xs font-normal opacity-90">$49</div>
                  </th>
                  <th className="p-4 bg-brand-600 text-white text-center font-bold border-l border-brand-500 w-[20%] shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
                    <div>Corporate</div>
                    <div className="text-xs font-normal opacity-90">$199</div>
                  </th>
                  <th className="p-4 bg-slate-800 text-white text-center font-medium border-l border-white/20 w-[20%]">
                    <div>Technical</div>
                    <div className="text-xs font-normal opacity-90">$399</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-x border-b border-gray-100">
                {comparisonFeatures.map((feature, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4 text-gray-600">{feature.name}</td>
                    <td className="p-4 text-center">
                      {typeof feature.personal === "boolean" ? (
                        feature.personal ? (
                          <span className="text-brand-500 font-bold text-lg leading-none">
                            ✓
                          </span>
                        ) : (
                          <span className="text-gray-300 font-bold text-lg leading-none">
                            ✕
                          </span>
                        )
                      ) : (
                        <div className="text-xs text-gray-600 font-medium">
                          {feature.personal}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center bg-brand-50/20">
                      {typeof feature.corporate === "boolean" ? (
                        feature.corporate ? (
                          <span className="text-brand-600 font-bold text-lg leading-none">
                            ✓
                          </span>
                        ) : (
                          <span className="text-brand-200 font-bold text-lg leading-none">
                            ✕
                          </span>
                        )
                      ) : (
                        <div className="text-xs text-brand-700 font-bold">
                          {feature.corporate}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.technical === "boolean" ? (
                        feature.technical ? (
                          <span className="text-brand-500 font-bold text-lg leading-none">
                            ✓
                          </span>
                        ) : (
                          <span className="text-gray-300 font-bold text-lg leading-none">
                            ✕
                          </span>
                        )
                      ) : (
                        <div className="text-xs text-gray-600 font-medium">
                          {feature.technical}
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
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

      {/* Footer Section */}
      <footer className="bg-[#2B3544] text-gray-300 py-16 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center">
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
              { label: "About Us", href: "#" },
              { label: "Privacy Policy", href: "/privacy-policy" },
              { label: "Terms & Conditions", href: "/terms-conditions" },
              { label: "Refund Policy", href: "#" },
              { label: "Contact Support", href: "/support" },
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
