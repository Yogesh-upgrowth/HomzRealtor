"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { MapPin, Building2, ChevronRight, Images } from "lucide-react";
import ProjectCtas from "./ProjectCtas";
import SaveToggleButton from "@/components/Common/SaveToggleButton";
import ReraBadge from "@/components/Common/ReraBadge";
import { scrollToHash } from "@/lib/scrollToHash";

type Props = {
  name: string;
  builder: string;
  cityKey: string;
  slug: string;
  cityName: string;
  citySlug: string;
  sectorLabel?: string | null;
  sectorHref?: string | null;
  /** Developer hub for the second breadcrumb trail, when that page exists. */
  developerSlug?: string | null;
  developerName?: string | null;
  locationLine: string;
  propertyCategory: string;
  propertyType: string | null;
  status: string;
  rera: string | null;
  reraStatus?: string | null;
  priceText: string;
  priceSubtext: string | null;
  possession?: string | null;
  investmentScore?: { score: number; grade: string } | null;
  images: string[];
  enquireHref: string;
};

// Full-bleed hero — sole consumer is app/project-listing/[city]/[slug]/page.tsx,
// safe to redesign freely. Multi-image browsing lives entirely in the
// "Gallery & Plans" section (GalleryTabs, #gallery) further down the page.
const ProjectHero = ({
  name,
  builder,
  cityKey,
  slug,
  cityName,
  citySlug,
  sectorLabel,
  sectorHref,
  developerSlug,
  developerName,
  locationLine,
  propertyCategory,
  propertyType,
  status,
  rera,
  reraStatus,
  priceText,
  images,
  enquireHref,
}: Props) => {
  const pills = [propertyCategory, propertyType, status].filter(Boolean) as string[];
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const heroImage = images[0] || null;

  // Measured from the real navbar (#site-navbar) rather than a hardcoded
  // pt-28 guess — the navbar shrinks by ~35-45px once its promo bar is
  // dismissed (persisted for 7 days), which otherwise left extra dead space
  // above the breadcrumb for any returning visitor. 112 matches pt-28, used
  // until the real height is measured on mount.
  const [topOffset, setTopOffset] = useState(112);
  useLayoutEffect(() => {
    const navEl = document.getElementById("site-navbar");
    if (!navEl) return;
    const update = () => setTopOffset(navEl.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(navEl);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="top" className="relative">
      <div className="absolute inset-0 overflow-hidden">
        {heroImage && !heroImageFailed ? (
          <Image
            src={heroImage}
            alt={name}
            fill
            priority
            unoptimized
            onError={() => setHeroImageFailed(true)}
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-[#141416]" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0C]/60 via-[#0B0B0C]/15 to-[#0B0B0C]" />

      <div
        style={{ paddingTop: topOffset }}
        className="relative mx-auto flex min-h-[clamp(480px,72vh,640px)] max-w-7xl flex-col justify-end px-4 pb-16 md:px-2"
      >

        <div className="mb-auto">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 pt-2 text-xs text-gray-300">
          <Link href="/" className="shrink-0 hover:text-[#D9B268]">Home</Link>
          <ChevronRight size={12} className="shrink-0" />
          <Link href="/project-listing" className="shrink-0 hover:text-[#D9B268]">Projects</Link>
          <ChevronRight size={12} className="shrink-0" />
          <Link href={`/project-listing/${citySlug}`} className="shrink-0 hover:text-[#D9B268]">{cityName}</Link>
          <ChevronRight size={12} className="shrink-0" />
          {sectorHref && sectorLabel && (
            <>
              <Link href={sectorHref} className="shrink-0 hover:text-[#D9B268]">{sectorLabel}</Link>
              <ChevronRight size={12} className="shrink-0" />
            </>
          )}
          <span className="min-w-0 flex-1 truncate font-medium text-[#D9B268]">{name}</span>
        </nav>
        {/* Developer-page brief §7: a second trail through the developer, so
            every project page links its developer hub above the fold. */}
        {developerSlug && developerName && (
          <nav aria-label="Developer breadcrumb" className="flex items-center gap-1 pt-1 text-xs text-gray-400">
            <Link href="/" className="shrink-0 hover:text-[#D9B268]">Home</Link>
            <ChevronRight size={12} className="shrink-0" />
            <Link href="/developer" className="shrink-0 hover:text-[#D9B268]">Developers</Link>
            <ChevronRight size={12} className="shrink-0" />
            <Link href={`/developer/${developerSlug}`} className="shrink-0 hover:text-[#D9B268]">{developerName}</Link>
            <ChevronRight size={12} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{name}</span>
          </nav>
        )}
        </div>

        {pills.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {pills.map((p) => (
              <span
                key={p}
                className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-gray-100"
              >
                {p}
              </span>
            ))}
            {rera && <ReraBadge reraId={rera} status={reraStatus} variant="full" />}
          </div>
        )}

        <div className="mb-1.5 flex items-center gap-1.5 text-sm text-[#D9B268]">
          <Building2 size={14} />
          <span>{builder}</span>
        </div>

        {/* Audit item 10 (2026-09-19): the h1 was the bare project name, with
            the location in a separate paragraph below it. The searches these
            pages compete for carry the location in the query ("m3m route 65
            sector 65 gurgaon"), so the location belongs inside the heading,
            not next to it. Set as a smaller block inside the same h1 — the
            visual hierarchy is unchanged, the heading text is not. */}
        <h1 className="mb-7 max-w-[18ch] font-display text-[clamp(40px,7vw,80px)] leading-[0.98] tracking-tight text-white">
          {name}
          <span className="mt-3 flex items-start gap-1.5 font-ui text-sm font-normal leading-snug tracking-normal text-gray-300 md:text-base">
            <MapPin size={16} className="mt-0.5 shrink-0 text-[#D9B268]" aria-hidden />
            <span>{locationLine}</span>
          </span>
        </h1>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-md flex-1">
            <ProjectCtas name={name} enquireHref={enquireHref} projectKey={`${cityKey}/${slug}`} variant="hero" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SaveToggleButton
              item={{
                itemType: "project",
                citySegment: cityKey,
                slug,
                title: name,
                imageUrl: images[0] || null,
                priceText,
                locationText: locationLine,
              }}
            />
            {images.length > 0 && (
              <a
                href="#gallery"
                onClick={(e) => scrollToHash("#gallery", e)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:border-[#D9B268] transition-colors cursor-pointer"
              >
                <Images size={15} /> View Gallery
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectHero;
