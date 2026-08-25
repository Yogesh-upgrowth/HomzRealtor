import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FormProvider } from "@/context/FormContext";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { WishlistProvider } from "@/context/WishlistContext";
import FormComponent from "@/components/FormComponent";
import AuthModal from "@/components/Auth/AuthModal";
import { Suspense } from "react";
import GoogleAnalyticsTracker from "@/components/GoogleAnalyticsTracker";
import ogImage from "@/assets/images/herobg.png";
import { getSectorsForCity, getAllBuilders, canonicalCitySlug } from "@/lib/intelligence/projects";
import { COMPANY_INFO } from "@/lib/seo/companyInfo";

const FOOTER_CITY_KEY = "ggn";

// app/layout.tsx

export const metadata: Metadata = {
  metadataBase: new URL("https://www.homzrealtor.com"),
  title: {
    // Gurgaon is the only market with real listings today — the other NCR
    // cities render live but empty "being updated" pages (see
    // app/project-listing/[city]/page.tsx), so claiming full coverage here
    // overclaims what a visitor (and a crawler) actually finds on the site.
    default:
      "HomzRealtor — Residential & Commercial Property in Gurgaon",
    // No "| HomzRealtor" suffix — every inner-page title is already
    // keyword-led and close to the ~60-char SERP truncation point; the 14
    // extra characters pushed nearly all of them past it, cutting off the
    // part that actually differentiates the result. A 12-month-old,
    // low-authority domain gets more from the keywords surviving intact
    // than from repeating a brand name searchers don't recognize yet.
    template: "%s",
  },
  // Kept to ~135 chars, safely under Google's ~155-160 display budget as a
  // complete sentence — the 207-char original wasn't sliced with a
  // hard-coded ellipsis, but at that length Google's own SERP rendering
  // would very likely clip it anyway. The "expanding soon" NCR-coverage
  // caveat this drops is still covered in the page's own visible copy.
  description:
    "Find verified residential and commercial projects in Gurgaon. Compare prices, explore amenities and get expert advice with HomzRealtor.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "HomzRealtor",
    url: "https://www.homzrealtor.com",
    title:
      "HomzRealtor — Residential & Commercial Property in Gurgaon",
    description:
      "Find verified residential and commercial projects in Gurgaon. Compare prices, explore amenities and get expert advice with HomzRealtor.",
    locale: "en_IN",
    images: [
      {
        url: ogImage.src,
        width: ogImage.width,
        height: ogImage.height,
        alt: "HomzRealtor — Residential & Commercial Property in Gurgaon, Noida & Delhi NCR",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [ogImage.src],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      // RealEstateAgent is the schema.org-correct, more specific type (it's a
      // LocalBusiness subtype), but tools that only recognize a fixed
      // "identity type" allowlist (Organization/Product/Person/Article/
      // SoftwareApplication) won't detect it under that name alone — declaring
      // both is valid multi-typing per schema.org, not a workaround.
      "@type": ["RealEstateAgent", "Organization"],
      "@id": "https://www.homzrealtor.com/#organization",
      name: "HomzRealtor",
      url: "https://www.homzrealtor.com",
      logo: "https://www.homzrealtor.com/android-icon-192x192.png",
      description:
        "HomzRealtor is a real estate advisory platform for verified residential and commercial property in Gurgaon, India.",
      slogan: "Where Your Property Journey Begins.",
      areaServed: ["Gurgaon", "Noida", "Greater Noida", "Delhi", "Faridabad"],
      // Phone/email are already public elsewhere on the site (the WhatsApp
      // CTA and the homepage contact section) — no invented contact details.
      // address/identifier (RERA)/sameAs (social) come from the same
      // lib/seo/companyInfo.ts COMPANY_INFO the footer and /contact page
      // use, and are omitted here too until those fields are filled in.
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: COMPANY_INFO.phone,
        email: COMPANY_INFO.email,
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
      },
      ...(COMPANY_INFO.officeAddress
        ? {
            address: {
              "@type": "PostalAddress",
              streetAddress: COMPANY_INFO.officeAddress,
              addressLocality: COMPANY_INFO.city,
              addressRegion: COMPANY_INFO.state,
              addressCountry: COMPANY_INFO.country,
            },
          }
        : {}),
      ...(COMPANY_INFO.hararaAgentNumber
        ? {
            identifier: {
              "@type": "PropertyValue",
              propertyID: "HARERA",
              value: COMPANY_INFO.hararaAgentNumber,
            },
          }
        : {}),
      ...(Object.values(COMPANY_INFO.social).some(Boolean)
        ? { sameAs: Object.values(COMPANY_INFO.social).filter(Boolean) }
        : {}),
    },
    {
      "@type": "WebSite",
      "@id": "https://www.homzrealtor.com/#website",
      url: "https://www.homzrealtor.com",
      name: "HomzRealtor",
      publisher: { "@id": "https://www.homzrealtor.com/#organization" },
      inLanguage: "en-IN",
    },
  ],
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Footer's "Popular Sectors" / "Top Developers" links — fetched once here
  // (cached via unstable_cache inside these functions) rather than in Footer
  // itself, since Footer needs usePathname() and so must stay a client
  // component. Failures degrade to an empty list rather than breaking the
  // footer on every page.
  const [sectors, builders] = await Promise.all([
    getSectorsForCity(FOOTER_CITY_KEY).catch(() => []),
    getAllBuilders().catch(() => []),
  ]);
  const topSectors = [...sectors]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((s) => ({ label: s.sector, href: `/project-listing/${canonicalCitySlug(FOOTER_CITY_KEY)}/sectors/${s.slug}` }));
  const topDevelopers = builders
    .slice(0, 6)
    .map((d) => ({ label: d.name, href: `/developer/${d.slug}` }));

  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c"),
          }}
        />
        <AuthProvider>
          <WishlistProvider>
            <AuthModalProvider>
              <FormProvider>
                <Header />
                <FormComponent />
                <AuthModal />
                {children}
                <Footer topSectors={topSectors} topDevelopers={topDevelopers} />
                <Suspense fallback={null}>
                  <GoogleAnalyticsTracker />
                </Suspense>
              </FormProvider>
            </AuthModalProvider>
          </WishlistProvider>
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
