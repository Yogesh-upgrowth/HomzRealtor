import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FormProvider } from "@/context/FormContext";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import FormComponent from "@/components/FormComponent";
import AuthModal from "@/components/Auth/AuthModal";
import { Suspense } from "react";
import GoogleAnalyticsTracker from "@/components/GoogleAnalyticsTracker";
import ogImage from "@/assets/images/herobg.png";
import { getSectorsForCity, getAllBuilders, canonicalCitySlug } from "@/lib/intelligence/projects";

const FOOTER_CITY_KEY = "ggn";

// app/layout.tsx

export const metadata: Metadata = {
  metadataBase: new URL("https://www.homzrealtor.com"),
  title: {
    default:
      "HomzRealtor — Residential & Commercial Property in Gurgaon, Noida & Delhi NCR",
    template: "%s | HomzRealtor",
  },
  description:
    "Find verified residential and commercial projects across Gurgaon, Noida, Greater Noida, Delhi and Faridabad. Compare prices, explore amenities and get expert advice with HomzRealtor.",
  keywords: [
    "property in Delhi NCR",
    "residential projects in Gurgaon",
    "commercial projects in Gurgaon",
    "property in Noida",
    "new launch projects Delhi NCR",
    "ready to move flats",
    "real estate Gurgaon Noida",
    "buy property Delhi NCR",
    "HomzRealtor",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "HomzRealtor",
    url: "https://www.homzrealtor.com",
    title:
      "HomzRealtor — Residential & Commercial Property in Gurgaon, Noida & Delhi NCR",
    description:
      "Find verified residential and commercial projects across Delhi NCR. Compare prices, explore amenities and get expert advice with HomzRealtor.",
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
      "@type": "RealEstateAgent",
      "@id": "https://www.homzrealtor.com/#organization",
      name: "HomzRealtor",
      url: "https://www.homzrealtor.com",
      logo: "https://www.homzrealtor.com/android-icon-192x192.png",
      slogan: "Where Your Property Journey Begins.",
      areaServed: ["Gurgaon", "Noida", "Greater Noida", "Delhi", "Faridabad"],
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
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
