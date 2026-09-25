import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  getBuilderBySlug,
  getAllBuilders,
  canonicalCitySlug,
  isIndexableDeveloper,
} from "@/lib/intelligence/projects";
import { buildDeveloperProfile, buildDeveloperFaqs } from "@/lib/intelligence/developerProfile";
import { formatInr } from "@/lib/intelligence/normalize";
import SimilarProjects from "@/components/Project/intelligence/SimilarProjects";
import DeveloperIntelligence from "@/components/Developer/DeveloperIntelligence";
import Faq from "@/components/Project/intelligence/Faq";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";
import { AskingPriceNote, DataUpdated } from "@/components/Common/DataUpdated";
import DeveloperIntentNav from "@/components/Developer/DeveloperIntentNav";
import DeveloperPriceTable from "@/components/Developer/DeveloperPriceTable";
import DeveloperLocations from "@/components/Developer/DeveloperLocations";
import DeveloperEntity from "@/components/Developer/DeveloperEntity";
import { availableDeveloperViews } from "@/lib/intelligence/developerViews";
import { developerProfileFacts } from "@/lib/content/developerProfiles";
import { editorialFaqsFor, publishedEditorialFor } from "@/lib/content/editorial/registry";
import EditorialSections from "@/components/Editorial/EditorialSections";
import EditorialTradeoffs from "@/components/Editorial/EditorialTradeoffs";
import EditorialByline from "@/components/Editorial/EditorialByline";
import PageProvenance from "@/components/Editorial/PageProvenance";

const SITE = "https://www.homzrealtor.com";

// ISR — matches lib/scraping/homzbackend.ts's 30-min data-cache TTL; without
// this every crawl/visit re-executes the origin function uncached.
// revalidate alone doesn't activate it for a dynamic segment — needs
// generateStaticParams too, see app/project-listing/[city]/page.tsx's
// comment for how this was verified.
// 1 week, not 30min or 6h — see app/buy-property/[city]/[slug]/page.tsx's comment on this same line (Vercel Hobby-plan ISR-write/origin-transfer/CPU budget, 2026-09-09).
export const revalidate = 604800;

export async function generateStaticParams() {
  const builders = await getAllBuilders().catch(() => []);
  return builders.map((b) => ({ slug: b.slug }));
}

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBuilderBySlug(slug).catch(() => null);
  if (!data) return {};

  const { summary } = data;
  const cityNames = summary.cities.map((c) => c.name);
  const cityLabel =
    cityNames.length > 1
      ? `${cityNames.slice(0, -1).join(", ")} & ${cityNames[cityNames.length - 1]}`
      : cityNames[0] || "Delhi NCR";

  // 2026-09-22: the title now leads with the head term this page is meant to
  // own ("{Developer} Projects in Gurgaon") and adds the two highest-intent
  // modifiers. The old form led with the brand and buried the query.
  const title = `${summary.name} Projects in ${cityLabel}: Prices & New Launches`;
  const description =
    `Explore ${summary.count} ${summary.name} ${summary.count === 1 ? "project" : "projects"} ` +
    `in ${cityLabel}` +
    (summary.residential && summary.commercial
      ? ` including ${summary.residential} residential and ${summary.commercial} commercial developments.`
      : ".") +
    ` Compare current asking prices, sectors, possession status and RERA registration on HomzRealtor.`;

  return {
    title,
    description,
    // 2026-09-21, per the 21 Sep audit's entity-validation recommendation: a
    // hub holding a single project is a thin indexable page whose whole
    // content is one card that already has its own URL. It keeps rendering
    // and stays crawlable, so the project remains reachable and any already
    // indexed URL does not start 404ing -- it is simply not offered for
    // indexing. follow:true so the link equity still flows to the project.
    ...(isIndexableDeveloper(summary) ? {} : { robots: { index: false, follow: true } }),
    alternates: { canonical: `${SITE}/developer/${summary.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE}/developer/${summary.slug}`,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

const DeveloperPage = async ({ params }: PageParams) => {
  const { slug } = await params;
  const data = await getBuilderBySlug(slug).catch(() => null);
  if (!data) notFound();

  const { summary, projects } = data;
  const withImages = projects.filter((p) => p.images.length > 0);
  const pageUrl = `${SITE}/developer/${summary.slug}`;

  // The most recent feed timestamp across this developer's projects, falling
  // back to generation time. On an ISR route the generation time is exactly
  // when this copy of the figures was computed, which is the honest answer
  // when the feed carries no timestamp.
  const latestFeedUpdate = projects
    .map((p) => (p.updated_at ? new Date(p.updated_at) : null))
    .filter((d): d is Date => Boolean(d) && !Number.isNaN(d!.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const dataAsOf = (latestFeedUpdate ?? new Date()).toISOString();

  // Audit item 9 (2026-09-19): computed portfolio facts, so the page is about
  // the builder rather than being a nine-card teaser with their name on it.
  const profile = buildDeveloperProfile(projects, canonicalCitySlug);

  // 2026-09-22, Developer x Intent architecture. The views this developer has
  // enough inventory to fill, and the corridors among them good enough to have
  // their own indexable page — the locations table links to those rather than
  // to a generic corridor hub.
  const views = availableDeveloperViews(projects);
  const facts = developerProfileFacts(summary.slug);
  const linkedCorridors = new Set(
    views.filter((v) => v.view.kind === "corridor" && v.indexable).map((v) => v.view.slug)
  );

  const cityNames = summary.cities.map((c) => c.name);
  const cityLabel =
    cityNames.length > 1
      ? `${cityNames.slice(0, -1).join(", ")} & ${cityNames[cityNames.length - 1]}`
      : cityNames[0] || "Delhi NCR";

  // Unique, data-driven intro so no two developer pages read the same.
  const intro =
    `${summary.name} has ${summary.count} ${summary.count === 1 ? "project" : "projects"} ` +
    `listed on HomzRealtor across ${cityLabel}` +
    (summary.residential && summary.commercial
      ? `, spanning ${summary.residential} residential and ${summary.commercial} commercial ${
          summary.residential + summary.commercial === 1 ? "development" : "developments"
        }.`
      : ".") +
    (profile.price
      ? ` Listed entry prices run from ${formatInr(profile.price.minInr)} to ${formatInr(
          profile.price.maxInr
        )}, with a median of ${formatInr(profile.price.medianInr)} across the ${
          profile.price.pricedCount
        } projects carrying a price.`
      : "") +
    (profile.readyToMove + profile.underConstruction > 0
      ? ` ${profile.readyToMove} ${profile.readyToMove === 1 ? "is" : "are"} ready to move and ${
          profile.underConstruction
        } ${profile.underConstruction === 1 ? "is" : "are"} under construction.`
      : "") +
    (summary.mergedNames.length > 0
      ? ` Our records spell this developer's name ${
          summary.mergedNames.length === 1 ? "one other way" : "several other ways"
        } (${summary.mergedNames.join(", ")}); those projects are counted here rather than on a separate page.`
      : "") +
    ` Everything below is computed from our own catalogue, and every project is linked by name.`;

  // Other developers for internal linking (exclude the current one).
  // Confirmed entities only (2026-09-21, checklist item 3) — these chips were
  // the main way unconfirmed parser output accumulated internal links, which
  // is what made those pages look like endorsed entities to a crawler.
  const others = (await getAllBuilders().catch(() => []))
    .filter((d) => d.slug !== summary.slug && isIndexableDeveloper(d))
    .slice(0, 12);

  // Homz Content Standard v1 (2026-09-22): the editorial slot for this
  // developer. Null for every developer today — no Layer C copy is written
  // yet — and the components below render nothing when it is. See
  // lib/content/editorial/developerPages.ts.
  const editorial = publishedEditorialFor("developer", summary.slug);

  // Answered entirely from the computed profile — only questions the data can
  // actually answer are emitted, since these feed FAQPage markup. Written
  // questions are appended after them.
  const faqs = [
    ...buildDeveloperFaqs(summary.name, cityLabel, profile, formatInr),
    ...editorialFaqsFor("developer", summary.slug),
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Developers", item: `${SITE}/developer` },
          { "@type": "ListItem", position: 3, name: summary.name, item: pageUrl },
        ],
      },
      {
        // R19-06 (2026-09-19): was RealEstateAgent. This node describes the
        // builder, not Homz, but sitting on a homzrealtor.com URL with a
        // multi-city areaServed it read as a second estate-agent entity
        // claiming NCR-wide coverage — directly contradicting the sitewide
        // Organization.areaServed: ["Gurgaon"]. A property developer is an
        // Organization; areaServed here is the developer's own project
        // footprint, which is a fact about them, not a Homz service claim.
        //
        // 2026-09-22: `url` was this page. That was wrong in a way that
        // matters for entity resolution — it told Google the developer's
        // canonical home is our URL. Where we hold the official site it is now
        // url + sameAs, and this page identifies itself as a CollectionPage
        // ABOUT that organisation rather than as the organisation.
        "@type": "Organization",
        "@id": `${pageUrl}#developer`,
        name: facts?.officialName ?? summary.name,
        ...(facts
          ? { url: facts.officialWebsite, sameAs: [facts.officialWebsite] }
          : {}),
        areaServed: summary.cities.map((c) => ({
          "@type": "City",
          name: c.name,
        })),
      },
      {
        "@type": "CollectionPage",
        name: `${summary.name} Projects in ${cityLabel}`,
        description: intro,
        url: pageUrl,
        about: { "@id": `${pageUrl}#developer` },
        // Homz publishes the page; the developer is its subject. Keeping these
        // distinct is the whole point of the change above.
        publisher: { "@id": `${SITE}/#organization` },
      },
      // CollectionPage alone doesn't enumerate the developer's projects —
      // ItemList does, and it matches exactly what the page renders. That
      // used to be withImages.slice(0, 9); the page now links every project
      // by name in the index below the grid, so the list is the full set.
      ...(projects.length > 0
        ? [
            {
              "@type": "ItemList",
              numberOfItems: projects.length,
              itemListElement: projects.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: p.project_name,
                url: `${SITE}/project-listing/${canonicalCitySlug(p.city_key)}/${p.slug}`,
              })),
            },
          ]
        : []),
      ...(faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}#faq`,
              url: pageUrl,
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
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
    // SEO audit follow-up (2026-09-09): converted from the pre-dark-theme
    // light styling, matching /project-listing/[city]/sectors/[sector].
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
          <Link href="/developer" className="hover:text-[#CEA44E]">Developers</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">{summary.name}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          {summary.name} Projects in {cityLabel}
        </h1>
        <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">{intro}</p>

        {/* Quick facts */}
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-[#B77D2B] bg-black px-4 py-1.5 text-sm font-medium text-[#CEA44E]">
            {summary.count} {summary.count === 1 ? "Project" : "Projects"}
          </span>
          {summary.residential > 0 && (
            <span className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300">
              {summary.residential} Residential
            </span>
          )}
          {summary.commercial > 0 && (
            <span className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300">
              {summary.commercial} Commercial
            </span>
          )}
        </div>

        {/* Developer x Intent navigation (2026-09-22). Crawlable anchors, not
            a client filter: a filter that only exists after hydration is
            invisible to a crawler, so the child pages would never be found. */}
        <DeveloperIntentNav
          developerName={summary.name}
          developerSlug={summary.slug}
          // SEO audit 2026-09-25: link only the views that are offered to
          // search engines; "Projects in New Gurgaon (1)" was a crawlable
          // link into a page that then declared itself noindex.
          views={views.filter((v) => v.indexable)}
          totalCount={summary.count}
        />

        {/* Checklist item 3: the page says on its face when the entity is not
            confirmed, rather than only telling Google via a robots tag. A
            visitor who lands here from an old index entry should not have to
            guess how much of this is verified. */}
        {!isIndexableDeveloper(summary) && (
          <p className="mt-5 max-w-3xl rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-4 text-[13.5px] leading-relaxed text-gray-400">
            <span className="font-semibold text-gray-200">About this page.</span>{" "}
            {summary.count < 2
              ? `We currently list a single project under this name, so there is no portfolio to compare. The project itself is linked below.`
              : `"${summary.name}" is taken from the project records in our catalogue and has not been confirmed as a developer entity by our team.`}{" "}
            Nothing here is a claim about the company beyond what our own listings contain. If
            this is your company, or the name is wrong,{" "}
            <Link href="/contact" className="text-[#CEA44E] hover:underline">
              tell us
            </Link>{" "}
            and it gets corrected — see our{" "}
            <Link href="/editorial-policy" className="text-[#CEA44E] hover:underline">
              corrections policy
            </Link>
            .
          </p>
        )}

        {/* Cities this developer builds in — internal linking */}
        {summary.cities.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-400">
            <span className="text-gray-500">Active in:</span>
            {summary.cities.map((c) => (
              <Link
                key={c.slug}
                href={`/project-listing/${c.slug}`}
                className="rounded-full border border-gray-700 bg-black px-3 py-1 text-gray-300 hover:border-[#B77D2B] hover:text-[#CEA44E] transition"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Project grid (reuses the shared card component) — a visual preview of
          the nine best-presented projects. "View all" used to point at
          /project-listing?builder=<slug>, a query-param view this site does
          not server-render as anchors, so a builder with 40 projects linked 9
          of them and orphaned the rest. It now points at the complete index
          below, which links every one of them by name. */}
      {withImages.length > 0 ? (
        <SimilarProjects
          title={summary.name}
          projects={withImages.slice(0, 9)}
          heading={`Projects by ${summary.name}`}
          viewAllHref="#all-projects"
          viewAllLabel={`See all ${projects.length} →`}
        />
      ) : (
        <div className="w-full max-w-7xl mx-auto px-4 my-12 text-gray-500">
          Project listings for {summary.name} are being updated. Please{" "}
          <Link href="/project-listing" className="text-[#B77D2B] underline">
            browse all projects
          </Link>{" "}
          in the meantime.
        </div>
      )}

      <DeveloperIntelligence name={summary.name} cityLabel={cityLabel} profile={profile} />

      {/* Checklist items 13 and 14 (2026-09-22). The intro above quotes a
          median entry price with no date and no statement of what kind of
          price it is — the same gap the sector pages had before the rates
          page's treatment was carried across. */}
      <div className="w-full max-w-7xl mx-auto px-4 mt-6">
        <div className="max-w-3xl space-y-1.5">
          <DataUpdated date={dataAsOf} label="Portfolio data updated" />
          {profile.price && <AskingPriceNote scope={`${summary.name}'s portfolio`} />}
        </div>
      </div>

      <DeveloperPriceTable
        developerName={summary.name}
        projects={projects}
        citySlug={canonicalCitySlug("ggn")}
        asOf={dataAsOf}
      />

      <DeveloperLocations
        developerName={summary.name}
        developerSlug={summary.slug}
        projects={projects}
        linkedCorridors={linkedCorridors}
        citySlug={canonicalCitySlug("ggn")}
      />

      {/* The complete index. Every project this builder has on HomzRealtor,
          linked by name, so nothing in the portfolio depends on a query-param
          view to be reachable. Grouped by city where the builder spans more
          than one. */}
      {projects.length > 0 && (
        <section id="all-projects" className="w-full max-w-7xl mx-auto px-4 mt-12 scroll-mt-28">
          <h2 className="mb-1 text-2xl font-bold text-white">
            All {projects.length} {summary.name}{" "}
            {projects.length === 1 ? "project" : "projects"}
          </h2>
          <p className="mb-5 text-[13px] text-gray-500">
            Every project we list for this developer, with its location and current status.
          </p>
          <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={`${p.city_key}-${p.slug}`} className="border-b border-white/[0.05] pb-2.5">
                <Link
                  href={`/project-listing/${canonicalCitySlug(p.city_key)}/${p.slug}`}
                  className="text-[14.5px] text-gray-300 transition hover:text-[#CEA44E]"
                >
                  {p.project_name}
                </Link>
                <span className="block text-[12px] text-gray-600">
                  {[p.sector, p.micro_market, p.city_name]
                    .filter((v, i, a) => v && a.indexOf(v) === i)
                    .join(", ")}
                  {p.project_status ? ` · ${p.project_status}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Homz Content Standard v1 — the written analysis, when there is any.
          Renders nothing until a writer's copy is registered and scores 90+. */}
      <EditorialByline page={editorial} />
      <EditorialSections page={editorial} />
      <EditorialTradeoffs page={editorial} subject={summary.name} />

      <Faq title={summary.name} items={faqs} />

      <DeveloperEntity developerName={summary.name} facts={facts} />

      {/* Other developers — internal linking + crawlability */}
      {others.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Explore Other Developers</h2>
            <Link
              href="/developer"
              className="text-sm font-medium text-[#CEA44E] hover:underline whitespace-nowrap"
            >
              View all developers →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {others.map((d) => (
              <Link
                key={d.slug}
                href={`/developer/${d.slug}`}
                className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300 hover:border-[#B77D2B] hover:text-[#CEA44E] transition"
              >
                {d.name} <span className="text-gray-500">({d.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* "About this page's data" + Sources. Ships with or without editorial
          copy: everything it declares is true of the computed figures above. */}
      <PageProvenance snapshotAt={dataAsOf} page={editorial} />

      <AppointmentCard
        bgImage={bgImg}
        heading={`EXPLORE ${summary.name.toUpperCase()} PROJECTS`}
        para={`Get expert guidance on ${summary.name} developments: pricing, availability and a personalised investment view from the HomzRealtor team.`}
        btnTxt="Talk to an Expert"
      />
    </div>
  );
};

export default DeveloperPage;
