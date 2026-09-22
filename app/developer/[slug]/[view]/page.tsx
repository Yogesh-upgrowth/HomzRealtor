import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  getBuilderBySlug,
  canonicalCitySlug,
  isIndexableDeveloper,
} from "@/lib/intelligence/projects";
import {
  availableDeveloperViews,
  decideViewIndexable,
  projectsForView,
  resolveDeveloperView,
} from "@/lib/intelligence/developerViews";
import { developerProfileFacts } from "@/lib/content/developerProfiles";
import { buildDeveloperProfile } from "@/lib/intelligence/developerProfile";
import { formatInr } from "@/lib/intelligence/normalize";
import DeveloperIntentNav from "@/components/Developer/DeveloperIntentNav";
import DeveloperPriceTable from "@/components/Developer/DeveloperPriceTable";
import DeveloperEntity from "@/components/Developer/DeveloperEntity";
import SimilarProjects from "@/components/Project/intelligence/SimilarProjects";
import Faq from "@/components/Project/intelligence/Faq";
import AppointmentCard from "@/components/Common/Appointment";
import { DataUpdated } from "@/components/Common/DataUpdated";
import bgImg from "@/public/appointmentBG.jpg";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";

// Developer x Intent child pages (2026-09-22).
//
// One route serves all of them: /developer/dlf/residential,
// /developer/m3m/new-launch, /developer/emaar/golf-course-extension-road.
// See lib/intelligence/developerViews.ts for the view definitions and the
// indexability thresholds.
//
// WHAT THIS PAGE OWES ITS PARENT. It exists to catch a narrower query than
// "DLF projects in Gurgaon" — "DLF new launch projects", "DLF ready to move".
// If it cannot say something the parent does not, it should not be offered to
// Google, and decideViewIndexable() is what enforces that. Below the bar the
// page still renders in full: the visitor who clicked the filter gets their
// list, every link still works and still passes equity, and nothing 404s.
//
// The page also states, on its face, when it is not indexed and why. A reader
// should not have to guess whether a thin page is thin on purpose.

export const revalidate = 604800;

const SITE = "https://www.homzrealtor.com";

export function generateStaticParams() {
  // Same reasoning as the other developer and listing routes: an empty list
  // still activates on-demand ISR for every param without asking the build to
  // pre-render developers x views up front.
  return [];
}

type PageParams = { params: Promise<{ slug: string; view: string }> };

async function load(slugRaw: string, viewRaw: string) {
  const view = resolveDeveloperView(viewRaw);
  if (!view) return null;

  const data = await getBuilderBySlug(slugRaw).catch(() => null);
  if (!data) return null;

  const projects = projectsForView(view, data.projects);
  if (projects.length === 0) return null;

  return { view, summary: data.summary, all: data.projects, projects };
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug, view: viewSlug } = await params;
  const loaded = await load(slug, viewSlug);
  if (!loaded) return {};

  const { view, summary, projects } = loaded;
  const decision = decideViewIndexable(view, projects);
  const url = `${SITE}/developer/${summary.slug}/${view.slug}`;

  const year = new Date().getFullYear();
  const title =
    view.kind === "corridor"
      ? `${summary.name} ${view.label} in Gurgaon | HomzRealtor`
      : `${summary.name} ${view.label} in Gurgaon (${year}) | HomzRealtor`;

  const priced = projects.filter((p) => p.min_price_inr != null);
  const priceBit =
    priced.length >= 2
      ? ` Entry prices from ${formatInr(Math.min(...priced.map((p) => p.min_price_inr!)))}.`
      : "";

  const description =
    `${projects.length} ${summary.name} ${view.label.toLowerCase()} in Gurgaon — ${view.intent}.` +
    `${priceBit} Compare current asking prices, locations, possession status and RERA registration on HomzRealtor.`;

  return {
    title,
    description,
    // The parent developer hub being unindexable makes every child
    // unindexable too: a child cannot be a stronger entity than the developer
    // it belongs to.
    ...(decision.indexable && isIndexableDeveloper(summary)
      ? {}
      : { robots: { index: false, follow: true } }),
    keywords: [
      `${summary.name} ${view.label.toLowerCase()} gurgaon`,
      `${summary.name} ${view.slug.replace(/-/g, " ")}`,
      `${summary.name} projects gurgaon`,
    ],
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: [DEFAULT_OG_IMAGE] },
    twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
  };
}

const safeJson = (g: unknown) =>
  JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

export default async function DeveloperViewPage({ params }: PageParams) {
  const { slug, view: viewSlug } = await params;
  const loaded = await load(slug, viewSlug);
  if (!loaded) notFound();

  const { view, summary, all, projects } = loaded;
  const decision = decideViewIndexable(view, projects);
  const citySlug = canonicalCitySlug("ggn");
  const pageUrl = `${SITE}/developer/${summary.slug}/${view.slug}`;
  const facts = developerProfileFacts(summary.slug);
  const profile = buildDeveloperProfile(projects, canonicalCitySlug);
  const views = availableDeveloperViews(all);

  const latestFeed = projects
    .map((p) => (p.updated_at ? new Date(p.updated_at) : null))
    .filter((d): d is Date => Boolean(d) && !Number.isNaN(d!.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const asOf = (latestFeed ?? new Date()).toISOString();

  const withImages = projects.filter((p) => p.images.length > 0);

  // An intro written from this view's own numbers, so no two child pages —
  // across any developer — read the same.
  const statusMix =
    view.kind === "status"
      ? ""
      : ` Of these, ${profile.readyToMove} ${profile.readyToMove === 1 ? "is" : "are"} ready to move and ${profile.underConstruction} ${profile.underConstruction === 1 ? "is" : "are"} under construction.`;
  const intro =
    `HomzRealtor lists ${projects.length} ${summary.name} ${view.label.toLowerCase()} in Gurgaon — ${view.intent}.` +
    (profile.price
      ? ` Entry asking prices run from ${formatInr(profile.price.minInr)} to ${formatInr(profile.price.maxInr)}, with a median of ${formatInr(profile.price.medianInr)} across the ${profile.price.pricedCount} carrying a price.`
      : "") +
    statusMix +
    ` Everything below is computed from our own catalogue and every project links to its full record.`;

  const faqs = [
    {
      q: `How many ${summary.name} ${view.label.toLowerCase()} are there in Gurgaon?`,
      a: `HomzRealtor currently lists ${projects.length}. That is what is in our catalogue today, not a count of everything ${summary.name} has ever built.`,
    },
    ...(profile.price
      ? [
          {
            q: `What do ${summary.name} ${view.label.toLowerCase()} cost in Gurgaon?`,
            a: `Entry asking prices run from ${formatInr(profile.price.minInr)} to ${formatInr(profile.price.maxInr)}, median ${formatInr(profile.price.medianInr)} across ${profile.price.pricedCount} priced projects. These are asking prices from active inventory, not registered transaction prices, and they are negotiable.`,
          },
        ]
      : []),
    ...(profile.reraWithId > 0
      ? [
          {
            q: `Are these ${summary.name} projects RERA registered?`,
            a: `${profile.reraActive} of ${projects.length} carry an active HARERA registration in our records and ${profile.reraWithId} carry a registration number of some kind. A number on file is not the same as a live registration — check it on the HARERA portal before relying on it.`,
          },
        ]
      : []),
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Developers", item: `${SITE}/developer` },
          { "@type": "ListItem", position: 3, name: summary.name, item: `${SITE}/developer/${summary.slug}` },
          { "@type": "ListItem", position: 4, name: view.label, item: pageUrl },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `${summary.name} ${view.label} in Gurgaon`,
        description: intro,
        url: pageUrl,
        isPartOf: { "@id": `${SITE}/developer/${summary.slug}` },
        // The developer is what this collection is ABOUT. HomzRealtor remains
        // the publisher — see the note on the parent page about never letting
        // the developer's Organization read as ours.
        about: {
          "@type": "Organization",
          name: facts?.officialName ?? summary.name,
          ...(facts ? { url: facts.officialWebsite, sameAs: [facts.officialWebsite] } : {}),
        },
        publisher: { "@id": `${SITE}/#organization` },
      },
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

  return (
    <div className="bg-[#0B0B0C] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }} />

      <section className="w-full max-w-7xl mx-auto px-4 pt-28 md:pt-32">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#CEA44E]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/developer" className="hover:text-[#CEA44E]">Developers</Link>
          <ChevronRight size={12} />
          <Link href={`/developer/${summary.slug}`} className="hover:text-[#CEA44E]">{summary.name}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">{view.label}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          {summary.name} {view.label} in Gurgaon
        </h1>
        <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">{intro}</p>

        <DeveloperIntentNav
          developerName={summary.name}
          developerSlug={summary.slug}
          views={views}
          activeSlug={view.slug}
          totalCount={summary.count}
        />

        <div className="mt-5 max-w-3xl">
          <DataUpdated date={asOf} label="Project data updated" />
        </div>

        {/* Said on the page, not only in a robots tag. */}
        {!decision.indexable && decision.reason && (
          <p className="mt-5 max-w-3xl rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-4 text-[13.5px] leading-relaxed text-gray-400">
            <span className="font-semibold text-gray-200">About this page.</span>{" "}
            {decision.reason} It is not offered to search engines for that reason, and everything on
            it is also on{" "}
            <Link href={`/developer/${summary.slug}`} className="text-[#CEA44E] hover:underline">
              the full {summary.name} portfolio
            </Link>
            .
          </p>
        )}
      </section>

      {withImages.length > 0 && (
        <SimilarProjects
          title={summary.name}
          projects={withImages.slice(0, 9)}
          heading={`${summary.name} ${view.label}`}
          viewAllHref="#all-in-view"
          viewAllLabel={`See all ${projects.length} →`}
        />
      )}

      <DeveloperPriceTable
        developerName={`${summary.name} ${view.label}`}
        projects={projects}
        citySlug={citySlug}
        asOf={asOf}
      />

      <section id="all-in-view" className="w-full max-w-7xl mx-auto px-4 mt-12 scroll-mt-28">
        <h2 className="mb-1 text-2xl font-bold text-white">
          All {projects.length} {summary.name} {view.label.toLowerCase()}
        </h2>
        <p className="mb-5 text-[13px] text-gray-500">
          Every one we list, with its location and current status.
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
                {[p.sector, p.micro_market].filter((v, i, a) => v && a.indexOf(v) === i).join(", ")}
                {p.project_status ? ` · ${p.project_status}` : ""}
                {p.min_price_inr ? ` · from ${formatInr(p.min_price_inr)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Faq title={`${summary.name} ${view.label}`} items={faqs} />

      <DeveloperEntity developerName={summary.name} facts={facts} />

      <AppointmentCard
        bgImage={bgImg}
        heading={`EXPLORE ${summary.name.toUpperCase()} ${view.label.toUpperCase()}`}
        para={`Get current availability, pricing and a site visit on ${summary.name} ${view.label.toLowerCase()} in Gurgaon from the HomzRealtor team.`}
        btnTxt="Talk to an Expert"
      />
    </div>
  );
}
