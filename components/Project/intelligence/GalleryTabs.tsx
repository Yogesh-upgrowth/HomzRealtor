"use client";

import { useState } from "react";
import Carousel from "@/components/Carousel";
import SegmentedTabs from "@/components/Project/listing/SegmentedTabs";

type Props = {
  title: string;
  exterior: string[];
  interior: string[];
  masterPlan: { image?: string; content?: string } | null;
};

// Only builds tabs for buckets that actually have images — genuinely hides
// (no tab row at all) when there's just one, rather than showing a fake
// single-item tab strip.
const GalleryTabs = ({ title, exterior, interior, masterPlan }: Props) => {
  const buckets = [
    exterior.length > 0 && { id: "exterior", label: "Exterior", images: exterior },
    interior.length > 0 && { id: "interior", label: "Interior", images: interior },
    masterPlan?.image && { id: "masterplan", label: "Master Plan", images: [masterPlan.image] },
  ].filter(Boolean) as { id: string; label: string; images: string[] }[];

  const [active, setActive] = useState(buckets[0]?.id);

  if (buckets.length === 0) return null;

  const activeBucket = buckets.find((b) => b.id === active) || buckets[0];

  return (
    <section id="gallery" className="w-full max-w-7xl mx-auto px-2 my-12 scroll-mt-24">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Gallery & Plans – ${title}`}
      </h2>

      {buckets.length > 1 && (
        <SegmentedTabs
          tabs={buckets.map((b) => ({ id: b.id, label: b.label }))}
          active={activeBucket.id}
          onChange={setActive}
        />
      )}

      <Carousel images={activeBucket.images} alt={`${title} — ${activeBucket.label}`} />
    </section>
  );
};

export default GalleryTabs;
