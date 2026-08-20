"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProjectView } from "@/lib/intelligence/view-model";

type Row = { label: string; a: string | null; b: string | null };

function buildRows(a: ProjectView, b: ProjectView): Row[] {
  const rows: Row[] = [
    { label: "Starting Price", a: a.priceText, b: b.priceText },
    { label: "Property Type", a: a.propertyCategory, b: b.propertyCategory },
    { label: "Configuration", a: a.propertyType, b: b.propertyType },
    {
      label: "Status",
      a: a.status === "Status on request" ? null : a.status,
      b: b.status === "Status on request" ? null : b.status,
    },
    { label: "Possession", a: a.possession, b: b.possession },
    { label: "Location", a: a.sector || a.microMarket, b: b.sector || b.microMarket },
    {
      label: "Developer",
      a: a.builder !== "the developer" ? a.builder : null,
      b: b.builder !== "the developer" ? b.builder : null,
    },
    { label: "RERA ID", a: a.rera, b: b.rera },
    {
      label: "Unit Options",
      a: a.units.length > 0 ? `${a.units.length} configurations` : null,
      b: b.units.length > 0 ? `${b.units.length} configurations` : null,
    },
    {
      label: "Amenities",
      a: a.amenityCount > 0 ? `${a.amenityCount}+ amenities` : null,
      b: b.amenityCount > 0 ? `${b.amenityCount}+ amenities` : null,
    },
  ];

  return rows.filter((r) => r.a || r.b);
}

function ProjectMiniCard({ view }: { view: ProjectView }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="bg-black border border-gray-700 rounded-xl overflow-hidden">
      <div className="relative h-48 w-full bg-gray-800">
        {view.heroImage && !imgFailed ? (
          <Image
            src={view.heroImage}
            alt={view.name}
            fill
            unoptimized
            onError={() => setImgFailed(true)}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
            No Image
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/70 text-[#CEA44E] border border-[#CEA44E]/40">
          {view.propertyCategory}
        </span>
      </div>
      <div className="p-4">
        <h2 className="text-white font-semibold text-lg leading-snug mb-1">{view.name}</h2>
        <p className="text-gray-400 text-xs mb-2">{view.locationLine}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[#CEA44E] font-bold text-base">{view.priceText}</span>
          {view.builder !== "the developer" && (
            <span className="text-gray-500 text-xs">{view.builder}</span>
          )}
        </div>
        <Link
          href={`/project-listing/${view.citySlug}/${view.slug}`}
          className="mt-4 block text-center text-xs font-semibold text-black bg-[#CEA44E] rounded-lg py-2 hover:opacity-90 transition-opacity"
        >
          View Full Details
        </Link>
      </div>
    </div>
  );
}

type Props = {
  viewA: ProjectView;
  viewB: ProjectView;
};

const ProjectCompare = ({ viewA, viewB }: Props) => {
  const rows = buildRows(viewA, viewB);

  return (
    <section className="w-full max-w-5xl mx-auto px-2 mb-10">
      <h1 className="text-2xl sm:text-3xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6 text-center">
        {viewA.name} vs {viewB.name}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-8">
        <ProjectMiniCard view={viewA} />
        <span className="hidden sm:block text-gray-500 font-bold text-sm">VS</span>
        <ProjectMiniCard view={viewB} />
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto border border-gray-700 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-gray-400 text-left">
                <th className="p-3 font-medium">Detail</th>
                <th className="p-3 font-medium text-white">{viewA.name}</th>
                <th className="p-3 font-medium text-white">{viewB.name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="bg-black border-t border-gray-800">
                  <td className="p-3 text-gray-400">{row.label}</td>
                  <td className="p-3 text-white">{row.a || "—"}</td>
                  <td className="p-3 text-white">{row.b || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ProjectCompare;
