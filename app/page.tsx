import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { PortalShowcase } from "@/components/landing/PortalShowcase";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Gamification } from "@/components/landing/Gamification";
import { FAQ } from "@/components/landing/FAQ";
import { FAQS } from "@/lib/faq-data";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { LandingCursor } from "@/components/landing/LandingCursor";
import { Pricing } from "@/components/landing/Pricing";
import { SITE } from "@/lib/site";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/icons/icon-512.png`,
  image: `${SITE.url}/og.png`,
  description: SITE.tagline,
  email: SITE.email,
  areaServed: {
    "@type": "Country",
    name: "Pakistan",
  },
  sameAs: [],
};

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url,
  applicationCategory: "EducationalApplication",
  operatingSystem: "All (Web, Android, iOS, Windows, macOS)",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "PKR",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "1280",
    bestRating: "5",
    worstRating: "1",
  },
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  description: SITE.tagline,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/past-papers?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const coursesJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: [
    {
      "@type": "Course",
      position: 1,
      name: "AKUEB Secondary & Higher Secondary Board Preparation (Class IX–XII)",
      description:
        "Comprehensive AKUEB exam practice for Physics, Chemistry, Biology, Mathematics and Computer Science with real past papers and instant AI marking.",
      provider: {
        "@type": "Organization",
        name: SITE.name,
        sameAs: SITE.url,
      },
    },
    {
      "@type": "Course",
      position: 2,
      name: "Sindh Board SSC & HSC Exam Mastery (Class IX–XII)",
      description:
        "Targeted Sindh Board past papers, solved model papers, solved notes, and practical journals for Karachi, Sukkur, and Hyderabad boards.",
      provider: {
        "@type": "Organization",
        name: SITE.name,
        sameAs: SITE.url,
      },
    },
  ],
};

export default function Home() {
  return (
    <div className="landing-cursor-area min-h-screen overflow-x-clip bg-background selection:bg-amber-300 selection:text-amber-950 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(coursesJsonLd) }}
      />
      <LandingCursor />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <PortalShowcase />
        <Features />
        <HowItWorks />
        <Gamification />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
