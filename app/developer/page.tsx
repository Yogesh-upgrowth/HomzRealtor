import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { getAllBuilders, isIndexableDeveloper } from "@/lib/intelligence/projects";
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
  alternates: { canonical: `${SITE}/developer` },
  openGraph: {
    title: "Property Developers & Builders in Gurgaon | HomzRealtor",
    description:
      "Browse real estate developers and builders with projects listed on HomzRealtor, covering Gurgaon. Explore each developer's projects, prices and developments.",
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

  // Checklist item 3 (2026-09-21). The directory used to treat every name the
  // builder parser produced as a developer of equal standing. It now separates
  // the two things it was conflating: entities confirmed against the canonical
  // table in lib/content/developers.ts, and names taken from project titles
  // that nobody has confirmed. Both stay linked so every project behind them
  // remains reachable — only the confirmed set is enumerated in schema or
  // presented as a developer directory.
  const confirmed = developers.filter(isIndexableDeveloper);
  const unconfirmed = developers.filter((d) => !isIndexableDeveloper(d));

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
      // Enumerates the confirmed set only, and says how many — an ItemList
      // covering unconfirmed parser output would be asserting those entities
      // are developers, which is precisely what item 3 forbids.
      ...(confirmed.length > 0
        ? [
            {
              "@type": "ItemList",
              numberOfItems: confirmed.length,
              itemListElement: confirmed.map((d, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: d.name,
                url: `${SITE}/developer/${d.slug}`,
              })),
            },
          ]
        : []),
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
          Explore {confirmed.length > 0 ? `${confirmed.length} ` : ""}real estate developers
          with projects listed on HomzRealtor. Select a developer to view their full portfolio,
          prices and developments.
        </p>
      </section>

      {confirmed.length > 0 ? (
        <section className="w-full max-w-7xl mx-auto px-4 my-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {confirmed.map((d) => (
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

      {/* Names our catalogue carries that are not confirmed developer
          entities. Listed, and linked, so nothing behind them is orphaned —
          but described for what they are rather than presented as companies,
          and each of those pages is noindex,follow. */}
      {unconfirmed.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-10">
          <h2 className="text-xl font-bold text-white">Other builder names in our catalogue</h2>
          <p className="mt-2 mb-4 max-w-3xl text-[13.5px] leading-relaxed text-gray-500">
            These {unconfirmed.length} names come from the project records themselves and have
            not yet been confirmed as developer entities, or hold too little inventory for a
            portfolio page to tell you anything. They are listed so their projects stay
            reachable. If one of these is your company and the page is wrong, tell us and it
            gets corrected — see our{" "}
            <Link href="/editorial-policy" className="text-[#B77D2B] hover:underline">
              corrections policy
            </Link>
            .
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {unconfirmed.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/developer/${d.slug}`}
                  className="text-[13.5px] text-gray-400 hover:text-[#CEA44E] transition"
                >
                  {d.name} <span className="text-gray-600">({d.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
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
