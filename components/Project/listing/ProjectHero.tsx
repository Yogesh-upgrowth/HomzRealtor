"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { MapPin, Building2, BadgeCheck, ChevronRight, Images } from "lucide-react";
import ProjectCtas from "./ProjectCtas";

type Props = {
  name: string;
  builder: string;
  cityName: string;
  citySlug: string;
  sectorLabel?: string | null;
  sectorHref?: string | null;
  locationLine: string;
  propertyCategory: string;
  propertyType: string | null;
  status: string;
  rera: string | null;
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
  cityName,
  citySlug,
  sectorLabel,
  sectorHref,
  locationLine,
  propertyCategory,
  propertyType,
  status,
  rera,
  images,
  enquireHref,
}: Props) => {
  const pills = [propertyCategory, propertyType, status].filter(Boolean) as string[];
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
        {heroImage ? (
          <Image
            src={heroImage}
            alt={name}
            fill
            priority
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

        <nav className="mb-auto flex items-center gap-1 pt-2 text-xs text-gray-300">
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
            {rera && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#63C08D]/30 bg-[#63C08D]/14 px-3 py-1.5 text-xs font-bold text-[#7fd3a5]">
                <BadgeCheck size={13} /> RERA Registered
              </span>
            )}
          </div>
        )}

        <div className="mb-1.5 flex items-center gap-1.5 text-sm text-[#D9B268]">
          <Building2 size={14} />
          <span>{builder}</span>
        </div>

        <h1 className="mb-4 max-w-[15ch] font-display text-[clamp(40px,7vw,80px)] leading-[0.98] tracking-tight text-white">
          {name}
        </h1>

        <div className="mb-7 flex items-start gap-1.5 text-sm text-gray-300 md:text-base">
          <MapPin size={16} className="mt-0.5 shrink-0 text-[#D9B268]" />
          <span>{locationLine}</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-md flex-1">
            <ProjectCtas name={name} enquireHref={enquireHref} variant="hero" />
          </div>
          {images.length > 0 && (
            <a
              href="#gallery"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:border-[#D9B268] transition-colors"
            >
              <Images size={15} /> View Gallery
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProjectHero;
