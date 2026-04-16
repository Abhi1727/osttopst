import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Shared Base URL
const BASE_URL = "https://www.osttopst.us";

// Shared Organization Schema
const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "OST to PST",
  "url": BASE_URL,
  "logo": `${BASE_URL}/logo.png`,
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "availableLanguage": "English",
    "email": "support@osttopst.us"
  }
});

// Shared WebSite Schema
const getWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "OST to PST Converter",
  "url": BASE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${BASE_URL}/blogs?search={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
});

export const getPageSchema = (pathname) => {
  const schemas = [];

  // Always include website and organization on home page
  if (pathname === "/") {
    schemas.push(getWebsiteSchema());
    schemas.push(getOrganizationSchema());
    
    // SoftwareApplication for the main tool
    schemas.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Free OST to PST Converter",
      "operatingSystem": "Web",
      "applicationCategory": "UtilitiesApplication",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      },
      "description": "Convert OST files to PST and other formats freely online."
    });
  }

  // Formatting tools schema
  if (pathname.startsWith("/ost-to-")) {
    const format = pathname.replace("/ost-to-", "").toUpperCase();
    schemas.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": `Free OST to ${format} Converter`,
      "operatingSystem": "Web",
      "applicationCategory": "UtilitiesApplication",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      },
      "description": `Fast and secure tool to convert OST files directly to ${format} format online.`
    });
  }

  // specific routes
  switch (pathname) {
    case "/our-plans":
    case "/pricing":
      schemas.push({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Pricing Plans | OST to PST",
        "url": `${BASE_URL}${pathname}`,
        "mainEntity": {
          "@type": "Product",
          "name": "OST to PST Converter Subscription",
          "offers": [
            {
              "@type": "Offer",
              "name": "Basic Plan",
              "priceCurrency": "USD",
              "price": "0.00" // Adjust with actual pricing if known
            }
          ]
        }
      });
      break;

    case "/faq":
      // Add a base FAQ schema. (If FAQs are dynamic, this should be built from state)
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is an OST file?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "An OST file (Offline Outlook Data File) is used by Microsoft Exchange Server, Office 365, and Outlook.com to store a local copy of your mailbox data."
            }
          },
          {
            "@type": "Question",
            "name": "How to convert OST to PST?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You can use our free online converter tool by uploading your OST file and selecting PST as the desired output format."
            }
          }
        ]
      });
      break;

    case "/contact-us":
      schemas.push({
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "name": "Contact Us - OST to PST",
        "url": `${BASE_URL}/contact-us`
      });
      break;

    case "/blogs":
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "OST to PST Technical Blog",
        "url": `${BASE_URL}/blogs`
      });
      break;

    case "/ost-viewer":
      schemas.push({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Free Online OST Viewer",
        "operatingSystem": "Web",
        "applicationCategory": "UtilitiesApplication",
        "description": "View emails, contacts, and calendars from OST files online without Outlook."
      });
      break;

    case "/privacy-policy":
    case "/terms-conditions":
    case "/refund-policy":
      schemas.push({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": pathname.replace("/", "").replace("-", " ").replace(/\b\w/g, l => l.toUpperCase()),
        "url": `${BASE_URL}${pathname}`
      });
      break;

    default:
      // Don't add generic WebPage schema if it's a dynamic slug like /blogs/:slug
      // as that depends on API data and should be injected by the BlogPostDetail component.
      break;
  }

  return schemas;
};

const SchemaMarkup = () => {
  const location = useLocation();

  useEffect(() => {
    // Generate schemas for current path
    const schemas = getPageSchema(location.pathname);
    
    // Clear previously injected schemas
    const previousSchemas = document.querySelectorAll("script[data-schema='dynamic']");
    previousSchemas.forEach(sc => sc.remove());

    // Inject new schemas
    schemas.forEach(schema => {
      const script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-schema", "dynamic");
      script.textContent = JSON.stringify(schema, null, 2);
      document.head.appendChild(script);
    });

    return () => {
      // Cleanup on unmount or route change (optional but good practice)
      const scripts = document.querySelectorAll("script[data-schema='dynamic']");
      scripts.forEach(sc => sc.remove());
    };
  }, [location.pathname]);

  return null;
};

export default SchemaMarkup;
