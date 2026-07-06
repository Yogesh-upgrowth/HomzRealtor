"use client";

import Link from "next/link";
import { MapPin, Building2, BadgeCheck, ChevronRight } from "lucide-react";
import Carousel from "@/components/Carousel";
import ProjectCtas from "./ProjectCtas";

type Props = {
  name: string;
  builder: string;
  cityName: string;
  citySlug: string;
  locationLine: string;
  propertyCategory: string;
  propertyType: string | null;
  status: string;
  rera: string | null;
  priceText: string;
  priceSubtext: string | null;
  images: string[];
  enquireHref: string;
};

const ProjectHero = ({
  name,
  builder,
  cityName,
  citySlug,
  locationLine,
  propertyCategory,
  propertyType,
  status,
  rera,
  priceText,
  priceSubtext,
  images,
  enquireHref,
}: Props) => {
  const pills = [propertyCategory, propertyType, status].filter(Boolean) as string[];

  return (
    <section className="w-full max-w-7xl mx-auto px-2 mt-28 md:mt-32">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:text-[#B77D2B]">Home</Link>
        <ChevronRight size={12} />
        <Link href="/project-listing" className="hover:text-[#B77D2B]">Projects</Link>
        <ChevronRight size={12} />
        <Link href={`/project-listing/${citySlug}`} className="hover:text-[#B77D2B]">{cityName}</Link>
        <ChevronRight size={12} />
        <span className="text-gray-800 font-medium line-clamp-1">{name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* Gallery */}
        <div className="lg:col-span-3">
          {images.length > 0 ? (
            <div className="[&_.max-w-4xl]:max-w-none">
              <Carousel images={images} />
            </div>
          ) : (
            <div className="flex h-[300px] md:h-[450px] items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              Images coming soon
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="lg:col-span-2">
          <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Building2 size={15} className="text-[#B77D2B]" />
              <span>{builder}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {name}
            </h1>

            <div className="mt-2 flex items-start gap-1.5 text-sm text-gray-600">
              <MapPin size={16} className="text-[#B77D2B] shrink-0 mt-0.5" />
              <span>{locationLine}</span>
            </div>

            {pills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {pills.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {p}
                  </span>
                ))}
                {rera && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    <BadgeCheck size={13} /> RERA
                  </span>
                )}
              </div>
            )}

            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                {priceSubtext || "Price"}
              </p>
              <p className="text-2xl font-bold bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent">
                {priceText}
              </p>
            </div>

            <div className="mt-auto pt-5">
              <ProjectCtas name={name} enquireHref={enquireHref} variant="hero" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectHero;
