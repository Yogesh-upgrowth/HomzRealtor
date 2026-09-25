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
import { buildDeveloperProfile } from "@/lib/intelligence/developerProfile";
import { formatInr } from "@/lib/intelligence/normalize";
import Faq from "@/components/Project/intelligence/Faq";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";
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
import SellingNowCards from "@/components/Developer/SellingNowCards";
import PriceSnapshot from "@/components/Developer/PriceSnapshot";
import LaunchTracker from "@/components/Developer/LaunchTracker";
import ResaleRentals from "@/components/Developer/ResaleRentals";
import {
  aboutParagraphs,
  buildSellingNowCard,
  developerFaqs,
  developerFootprint,
  getDeveloperResale,
  intentStatus,
  INTENT_STATUS_LABEL,
  priceSplit,
  sortByIntent,
  type TrackerRow,
} from "@/lib/intelligence/developerPage";
import { getDeveloperNews } from "@/lib/intelligence/news";
import { getProjectEvents } from "@/lib/status/queries";

const SITE = "https://www.homzrealtor.com";
const NEWS_MIN_PROJECTS = 8;

// ISR, 24 hours (developer-page brief §8; was one week). The weekly window
// was set 2026-09-09 for the ~38k listing pages after the Vercel pause; this
// route is a few hundred pages, so a daily regeneration is cheap, and the
// status sync (lib/status/sync.ts) also revalidates a developer's page when
// one of its projects changes status.
export const revalidate = 86400;

export async function generateStaticParams() {
  const builders = await getAllBuilders().catch(() => []);
  return builders.map((b) => ({ slug: b.slug }));
}

type PageParams = { params: Promise<{ slug: string }> };

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/** "Last verified": the newest of the developer's project timestamps and the
 *  date its entity facts were last checked. Generation time only when the
 *  feed carries no timestamp at all — on an ISR route that is when these
 *  figures were computed. */
function lastVerified(
  projects: { updated_at: string | null }[],
  factsCheckedAt: string | undefined
): string {
  const times = [...projects.map((p) => p.updated_at), factsCheckedAt]
    .map((v) => (v ? Date.parse(v) : NaN))
    .filter((t) => !Number.isNaN(t));
  return new Date(times.length ? Math.max(...times) : Date.now()).toISOString();
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBuilderBySlug(slug).catch(() => null);
  if (!data) return {};

  const { summary, projects } = data;
  const facts = developerProfileFacts(summary.slug);
  const ggn = projects.filter((p) => p.city_key === "ggn");
  const count = (s: ReturnType<typeof intentStatus>) => ggn.filter((p) => intentStatus(p) === s).length;
  const n = ggn.length || summary.count;
  const year = new Date().getFullYear();
  const residentialMin = priceSplit(ggn, canonicalCitySlug).residential?.minInr ?? null;
  const verified = formatDay(lastVerified(projects, facts?.lastCheckedAt ?? facts?.lastVerifiedAt));

  // Developer-page brief §4. The root layout's template appends
  // " | HomzRealtor" to <title>; og:title does not get the template, so it
  // carries the suffix explicitly and the two read identically.
  const title = `${summary.name} Projects in Gurgaon (${year}): ${n} Projects, Prices & New Launches`;
  const description =
    `${n} ${summary.name} projects in Gurgaon — ${count("new-launch") + count("upcoming")} new launches, ` +
    `${count("under-construction")} under construction, ${count("ready-to-move")} ready to move.` +
    (residentialMin ? ` Starting prices from ${formatInr(residentialMin)},` : "") +
    ` per sq ft rates, RERA status and resale availability. Verified ${verified}.`;

  return {
    title,
    description,
    ...(isIndexableDeveloper(summary) ? {} : { robots: { index: false, follow: true } }),
    alternates: { canonical: `${SITE}/developer/${summary.slug}` },
    openGraph: {
      title: `${title} | HomzRealtor`,
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

  const { summary } = data;
  // Intent order everywhere on the page (brief §1): new launch, upcoming,
  // under construction, ready; then most recently updated; then price.
  const projects = sortByIntent(data.projects);
  const ggn = projects.filter((p) => p.city_key === "ggn");
  const citySlug = canonicalCitySlug("ggn");
  const pageUrl = `${SITE}/developer/${summary.slug}`;
  const facts = developerProfileFacts(summary.slug);

  const verifiedAt = lastVerified(projects, facts?.lastCheckedAt ?? facts?.lastVerifiedAt);
  const verifiedLabel = formatDay(verifiedAt);

  const profile = buildDeveloperProfile(projects, canonicalCitySlug);
  const split = priceSplit(ggn, canonicalCitySlug);
  const footprint = developerFootprint(projects);

  const sellingNowProjects = ggn.filter((p) => {
    const s = intentStatus(p);
    return s === "new-launch" || s === "under-construction";
  });
  const sellingNowCards = sellingNowProjects.slice(0, 12).map((p) => buildSellingNowCard(p, citySlug));
  const readyToMove = ggn.filter((p) => intentStatus(p) === "ready-to-move");

  const views = availableDeveloperViews(projects);
  const linkedCorridors = new Set(
    views.filter((v) => v.view.kind === "corridor" && v.indexable).map((v) => v.view.slug)
  );

  // Launch tracker: developer news naming Gurgaon, plus our own catalogue
  // events for this developer's projects. Both sources degrade to [] when
  // their key/database is absent, and the section hides below five rows.
  const nameBySlug = new Map(ggn.map((p) => [p.slug, p.project_name]));
  const [news, events, resale] = await Promise.all([
    // NewsData's free tier is 200 credits/day; one call per developer page
    // regeneration is affordable only for the rollout set (>= 8 Gurgaon
    // projects, ~25 developers), not for all few hundred hubs.
    ggn.length >= NEWS_MIN_PROJECTS ? getDeveloperNews(summary.name).catch(() => []) : Promise.resolve([]),
    getProjectEvents("ggn", [...nameBySlug.keys()]).catch(() => []),
    getDeveloperResale(ggn).catch(() => null),
  ]);
  const trackerRows: TrackerRow[] = [
    ...news
      .filter((n) => n.publishedAt)
      .map((n) => ({
        date: new Date(n.publishedAt as string).toISOString(),
        headline: n.title,
        href: n.link,
        external: true,
        source: n.sourceName ?? "News",
      })),
    ...events.map((e) => {
      const name = nameBySlug.get(e.slug) ?? e.slug;
      return {
        date: new Date(e.at).toISOString(),
        headline:
          e.type === "listed"
            ? `${name} added to our catalogue${e.to ? ` (${e.to})` : ""}`
            : `${name}: status changed${e.from ? ` from ${e.from}` : ""}${e.to ? ` to ${e.to}` : ""}`,
        href: `/project-listing/${citySlug}/${e.slug}`,
        external: false,
        source: "HomzRealtor catalogue",
      };
    }),
  ]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 12);

  const intro =
    `${summary.name} has ${ggn.length} ${ggn.length === 1 ? "project" : "projects"} in Gurgaon on HomzRealtor: ` +
    `${footprint.newLaunch} newly launched or upcoming, ${footprint.underConstruction} under construction and ` +
    `${footprint.ready} ready to move` +
    (split.residential
      ? `. Residential entry asking prices run from ${formatInr(split.residential.minInr)} to ${formatInr(
          split.residential.maxInr
        )}, median ${formatInr(split.residential.medianInr)} across ${split.residential.pricedCount} priced projects`
      : "") +
    (resale ? `, and ${resale.sale + resale.rent} resale or rental listings sit inside its projects` : "") +
    `. Everything below is computed from our own catalogue; every project is linked by name.`;

  const others = (await getAllBuilders().catch(() => []))
    .filter((d) => d.slug !== summary.slug && isIndexableDeveloper(d))
    .slice(0, 12);

  const editorial = publishedEditorialFor("developer", summary.slug);

  const faqs = [
    ...developerFaqs(summary.name, split, footprint, sellingNowProjects, resale, profile.reraActive),
    ...editorialFaqsFor("developer", summary.slug),
  ];
  const about = aboutParagraphs(summary.name, facts, footprint);

  // Brief §6: Organization with only the fields the facts record holds,
  // ItemList of the "Selling now" projects, BreadcrumbList. No FAQPage.
  const sameAs = facts
    ? [facts.officialWebsite, ...(facts.sameAs ?? []).map((s) => s.url)]
    : [];
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
        // The developer, not Homz: url is their own site, never this page.
        "@type": "Organization",
        "@id": `${pageUrl}#developer`,
        name: facts?.officialName ?? summary.name,
        ...(facts ? { url: facts.officialWebsite, sameAs } : {}),
        ...(facts?.foundedYear ? { foundingDate: String(facts.foundedYear) } : {}),
        ...(facts?.founder ? { founder: { "@type": "Person", name: facts.founder } } : {}),
        ...(facts?.headquarters
          ? { address: { "@type": "PostalAddress", addressLocality: facts.headquarters, addressCountry: "IN" } }
          : {}),
        areaServed: summary.cities.map((c) => ({ "@type": "City", name: c.name })),
      },
      {
        "@type": "CollectionPage",
        name: `${summary.name} Projects in Gurgaon`,
        description: intro,
        url: pageUrl,
        dateModified: verifiedAt,
        about: { "@id": `${pageUrl}#developer` },
        publisher: { "@id": `${SITE}/#organization` },
      },
      ...(sellingNowCards.length > 0
        ? [
            {
              "@type": "ItemList",
              name: `${summary.name} projects selling now in Gurgaon`,
              numberOfItems: sellingNowCards.length,
              itemListElement: sellingNowCards.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: c.project.project_name,
                url: `${SITE}${c.href}`,
                // Own images only; the generated tile is inline SVG, not a URL.
                ...(c.image ? { image: c.image } : {}),
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
    <div className="bg-[#0B0B0C] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }} />

      <section className="w-full max-w-7xl mx-auto px-4 pt-28 md:pt-32">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#CEA44E]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/developer" className="hover:text-[#CEA44E]">Developers</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">{summary.name}</span>
        </nav>

        <p className="mb-3 text-[12.5px] text-gray-500">
          Last verified: <time dateTime={verifiedAt}>{verifiedLabel}</time>
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          {summary.name} Projects in Gurgaon
        </h1>
        <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">{intro}</p>

        {!isIndexableDeveloper(summary) && (
          <p className="mt-5 max-w-3xl rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-4 text-[13.5px] leading-relaxed text-gray-400">
            <span className="font-semibold text-gray-200">About this page.</span>{" "}
            {summary.count < 2
              ? `We currently list a single project under this name, so there is no portfolio to compare. The project itself is linked below.`
              : `"${summary.name}" is taken from the project records in our catalogue and has not been confirmed as a developer entity by our team.`}{" "}
            Nothing here is a claim about the company beyond what our own listings contain. If this is
            your company, or the name is wrong,{" "}
            <Link href="/contact" className="text-[#CEA44E] hover:underline">tell us</Link> and it gets
            corrected — see our{" "}
            <Link href="/editorial-policy" className="text-[#CEA44E] hover:underline">corrections policy</Link>.
          </p>
        )}
      </section>

      {/* 1. Selling now */}
      <SellingNowCards developerName={summary.name} cards={sellingNowCards} asOfLabel={verifiedLabel} />
      {sellingNowProjects.length > sellingNowCards.length && (
        <p className="w-full max-w-7xl mx-auto px-4 mt-3 text-[13px] text-gray-500">
          {sellingNowProjects.length - sellingNowCards.length} more selling now are listed under{" "}
          <a href="#all-projects" className="text-[#CEA44E] hover:underline">all projects</a>.
        </p>
      )}

      {/* 2. Price snapshot, residential only */}
      <PriceSnapshot developerName={summary.name} split={split} />

      {/* 3. Launch tracker */}
      <LaunchTracker developerName={summary.name} rows={trackerRows} />

      {/* 4. By status and by corridor */}
      <div className="w-full max-w-7xl mx-auto px-4 mt-12">
        <DeveloperIntentNav
          developerName={summary.name}
          developerSlug={summary.slug}
          // Only views offered to search engines are linked.
          views={views.filter((v) => v.indexable)}
          totalCount={summary.count}
        />
      </div>
      <DeveloperLocations
        developerName={summary.name}
        developerSlug={summary.slug}
        projects={projects}
        linkedCorridors={linkedCorridors}
        citySlug={citySlug}
      />

      {/* 5. Resale and rentals inside this developer's projects */}
      <ResaleRentals developerName={summary.name} data={resale} />

      {/* 6. Ready to move */}
      <DeveloperPriceTable
        developerName={summary.name}
        projects={readyToMove}
        citySlug={citySlug}
        asOf={verifiedAt}
        heading={`Ready to move ${summary.name} projects in Gurgaon`}
        minRows={1}
      />

      {/* 7. All projects, intent-ordered. Junk records never reach this list
          (isJunkProjectRecord is applied when the developer index is built). */}
      {projects.length > 0 && (
        <section id="all-projects" className="w-full max-w-7xl mx-auto px-4 mt-12 scroll-mt-28">
          <h2 className="mb-1 text-2xl font-bold text-white">
            All {projects.length} {summary.name} {projects.length === 1 ? "project" : "projects"}
          </h2>
          <p className="mb-5 text-[13px] text-gray-500">
            New launches first, then upcoming, under construction and ready to move.
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
                  {` · ${INTENT_STATUS_LABEL[intentStatus(p)]}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <EditorialByline page={editorial} />
      <EditorialSections page={editorial} />
      <EditorialTradeoffs page={editorial} subject={summary.name} />

      <Faq title={summary.name} items={faqs} />

      {/* 8. About + how to verify; 9. independence disclosure + HARERA agent */}
      <DeveloperEntity developerName={summary.name} facts={facts} about={about} />

      {others.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Explore Other Developers</h2>
            <Link href="/developer" className="text-sm font-medium text-[#CEA44E] hover:underline whitespace-nowrap">
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

      <PageProvenance snapshotAt={verifiedAt} page={editorial} />

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
