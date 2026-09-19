import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { getAllBuilders } from "@/lib/intelligence/projects";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";

const SITE = "https://www.homzrealtor.com";

// R19-06 (2026-09-19): the sitewide Organization.areaServed was narrowed to
// Gurgaon in ec7906c after the owner confirmed it as the only serviced market,
// but this page still advertised five NCR cities in its title, description and
// body copy — the four others render "being updated" empty pages. Reworded to
// lead with the market Homz actually serves, without claiming the directory
// holds only Gurgaon builders (it doesn't; their portfolios are their own).
export const metadata: Metadata = {
  title: "Property Developers & Builders in Gurgaon",
  description:
    "Browse real estate developers and builders with projects listed on HomzRealtor, covering Gurgaon. Explore each developer's projects, prices and developments.",
  keywords: [
    "property developers Delhi NCR",
    "builders in Gurgaon",
    "real estate developers Noida",
    "top builders Delhi NCR",
  ],
  alternates: { canonical: `${SITE}/developer` },
  openGraph: {
    title: "Property Developers & Builders in Delhi NCR",
    description:
      "Browse real estate developers and builders across Delhi NCR and explore their projects on HomzRealtor.",
    url: `${SITE}/developer`,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

const DevelopersIndexPage = async () => {
  const developers = await getAllBuilders().catch(() => []);
  const pageUrl = `${SITE}/developer`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Developers", item: pageUrl },
        ],
      },
      {
        "@type": "CollectionPage",
        name: "Property Developers in Delhi NCR",
        description:
          "Directory of real estate developers and builders with projects listed on HomzRealtor.",
        url: pageUrl,
      },
    ],
  };

  const safeJson = (g: unknown) =>
    JSON.stringify(g)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

  return (
    // SEO audit follow-up (2026-09-09): this page still shipped the pre-dark-theme
    // light styling after /project-listing's sector/detail pages were converted —
    // a real visual mismatch a visitor hits crossing from one hub to the other.
    <div className="bg-[#0B0B0C] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
      />

      <section className="w-full max-w-7xl mx-auto px-4 pt-28 md:pt-32">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#CEA44E]">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">Developers</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Property Developers in Gurgaon
        </h1>
        <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">
          Explore {developers.length > 0 ? `${developers.length} ` : ""}real estate developers
          with projects listed on HomzRealtor. Select a developer to view their full portfolio,
          prices and developments.
        </p>
      </section>

      {developers.length > 0 ? (
        <section className="w-full max-w-7xl mx-auto px-4 my-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {developers.map((d) => (
              <Link
                key={d.slug}
                href={`/developer/${d.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-gray-700 bg-black p-4 hover:border-[#B77D2B] transition"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FDF094] to-[#B77D2B] flex items-center justify-center shrink-0">
                  <span className="text-black font-bold text-lg">
                    {d.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate group-hover:text-[#CEA44E]">
                    {d.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {d.count} {d.count === 1 ? "project" : "projects"}
                    {d.cities.length > 0 && ` · ${d.cities.map((c) => c.name).join(", ")}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="w-full max-w-7xl mx-auto px-4 my-12 text-gray-500">
          Developer listings are being updated. Please{" "}
          <Link href="/project-listing" className="text-[#B77D2B] underline">
            browse all projects
          </Link>{" "}
          in the meantime.
        </div>
      )}

      <AppointmentCard
        bgImage={bgImg}
        heading="FIND THE RIGHT DEVELOPER FOR YOU"
        para="Get expert guidance on the best developers and projects across Delhi NCR: pricing, availability and a personalised investment view from the HomzRealtor team."
        btnTxt="Talk to an Expert"
      />
    </div>
  );
};

export default DevelopersIndexPage;
