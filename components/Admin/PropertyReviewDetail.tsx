"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import type { AgentPropertyDetail, PropertyReviewEventView } from "@/lib/properties/types";

type PropertyReviewDetailProps = {
  propertyId: string;
  onDecided?: () => void;
};

type DetailResponse = {
  property: AgentPropertyDetail;
  owner: { id: string; name: string; email: string; phone: string } | null;
  reviewHistory: PropertyReviewEventView[];
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-white/[0.05] last:border-0">
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-sm text-white text-right">{value}</span>
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (!items.length) return <span className="text-sm text-gray-500">None</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span
          key={i}
          className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-gray-300"
        >
          {i}
        </span>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-white/[0.08] bg-[#141416] p-5">
      <h3 className="text-sm font-bold text-[#D9B268] mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function PropertyReviewDetail({ propertyId, onDecided }: PropertyReviewDetailProps) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/properties/${propertyId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((json: DetailResponse) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this listing.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const handleReview = async (action: "approve" | "reject") => {
    if (action === "reject" && !reason.trim()) {
      toast.error("A reason is required to reject a listing");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      toast.success(action === "approve" ? "Listing approved" : "Listing rejected");
      onDecided?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[18px] border border-white/[0.08] bg-[#141416] p-10 text-center text-gray-400">
        Loading…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-[18px] border border-white/[0.08] bg-[#141416] p-10 text-center text-red-400">
        {error || "Not found"}
      </div>
    );
  }

  const { property, owner, reviewHistory } = data;
  const amenityEntries = Object.entries(property.detailedConfig.amenities).filter(
    ([, v]) => v && v.length > 0
  );

  return (
    <div className="flex flex-col gap-6">
      <Section title="Submitted by">
        <Row label="Name" value={owner?.name} />
        <Row label="Email" value={owner?.email} />
        <Row label="Phone" value={owner?.phone} />
      </Section>

      {property.media.images.length > 0 && (
        <Section title="Photos">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {property.media.images.map((img) => (
              <div key={img.url} className="relative aspect-video rounded-lg overflow-hidden bg-white/5">
                <Image src={img.url} alt={img.tag} fill unoptimized className="object-cover" />
                {img.isCover && (
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-[#D9B268]">
                    Cover
                  </span>
                )}
              </div>
            ))}
          </div>
          {property.media.video && (
            <p className="mt-3 text-sm text-gray-400">
              Video:{" "}
              <a
                href={property.media.video.url}
                target="_blank"
                rel="noreferrer"
                className="text-[#D9B268] underline"
              >
                {property.media.video.url}
              </a>
            </p>
          )}
        </Section>
      )}

      <Section title="Basic Info">
        <Row label="Listing Type" value={property.basicInfo.listingType} />
        <Row label="Building Type" value={property.basicInfo.buildingType} />
        <Row label="Property Type" value={property.basicInfo.propertyType} />
        <Row label="City" value={property.basicInfo.city} />
        <Row label="Locality" value={property.basicInfo.locality} />
        <Row label="Society" value={property.basicInfo.society} />
        <Row label="BHK" value={property.basicInfo.bhk} />
        <Row label="Suited For" value={property.basicInfo.suitedFor} />
        <Row
          label="Price"
          value={`₹${property.basicInfo.price.amount.toLocaleString("en-IN")} ${property.basicInfo.price.unit}`}
        />
        {property.basicInfo.maintenance && (
          <Row
            label="Maintenance"
            value={`₹${property.basicInfo.maintenance.amount.toLocaleString("en-IN")} ${
              property.basicInfo.maintenance.unit
            }${property.basicInfo.maintenance.includedInPrice ? " (included)" : ""}`}
          />
        )}
        <Row label="Security Deposit" value={property.basicInfo.securityDeposit} />
        <div className="pt-2">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">Area Details</p>
          <div className="flex flex-col gap-1">
            {property.basicInfo.areaDetails.map((a, i) => (
              <p key={i} className="text-sm text-gray-300">
                {a.areaSize} sq.ft — {a.areaType}
                {a.isDisplay ? " (headline)" : ""}
              </p>
            ))}
          </div>
        </div>
        {property.basicInfo.additionalSpaces.length > 0 && (
          <div className="pt-2">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">Additional Spaces</p>
            <ChipList items={property.basicInfo.additionalSpaces} />
          </div>
        )}
      </Section>

      <Section title="Configuration">
        <Row
          label="Available From"
          value={
            property.configuration.availableFrom.type === "Immediately"
              ? "Immediately"
              : property.configuration.availableFrom.date
          }
        />
        <Row label="Age of Property" value={property.configuration.ageOfProperty} />
        <Row label="Bathrooms" value={property.configuration.bathrooms} />
        <Row label="Covered Parking" value={property.configuration.coveredParking} />
        <Row label="Open Parking" value={property.configuration.openParking} />
        {property.configuration.balcony.length > 0 && (
          <div className="pt-2">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">Balcony</p>
            <ChipList items={property.configuration.balcony} />
          </div>
        )}
      </Section>

      <Section title="Detailed Configuration">
        <Row label="Furnishing" value={property.detailedConfig.furnishingStatus} />
        <Row label="Power Backup" value={property.detailedConfig.powerBackup} />
        <Row label="Facing" value={property.detailedConfig.facing} />
        <Row label="View" value={property.detailedConfig.view} />
        <Row
          label="Floor"
          value={
            property.detailedConfig.floorNumber != null
              ? `${property.detailedConfig.floorNumber} of ${property.detailedConfig.totalFloorCount ?? "?"}`
              : null
          }
        />
        <Row
          label="Connecting Road"
          value={
            property.detailedConfig.connectingRoadWidth
              ? `${property.detailedConfig.connectingRoadWidth.value} ${property.detailedConfig.connectingRoadWidth.unit}`
              : null
          }
        />
        {amenityEntries.length > 0 && (
          <div className="pt-2 flex flex-col gap-3">
            {amenityEntries.map(([category, items]) => (
              <div key={category}>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">{category}</p>
                <ChipList items={items ?? []} />
              </div>
            ))}
          </div>
        )}
      </Section>

      {property.media.highlights.length > 0 && (
        <Section title="Highlights">
          <ChipList items={property.media.highlights} />
        </Section>
      )}

      <Section title="Description">
        <p className="text-sm text-white font-semibold mb-2">{property.description.oneLineDescription}</p>
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{property.description.propertyDescription}</p>
      </Section>

      {reviewHistory.length > 0 && (
        <Section title="Review History">
          <div className="flex flex-col gap-2">
            {reviewHistory.map((e) => (
              <div key={e.id} className="text-sm text-gray-300">
                <span className="font-semibold text-white capitalize">{e.action}</span> by {e.adminName} on{" "}
                {new Date(e.at).toLocaleString("en-IN")}
                {e.reason && <span className="text-gray-500"> — {e.reason}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {property.status === "pending" && (
        <Section title="Decision">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (required to reject)"
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={() => handleReview("approve")}
              disabled={submitting}
              className="flex-1 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3 font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Approve
            </button>
            <button
              onClick={() => handleReview("reject")}
              disabled={submitting}
              className="flex-1 rounded-xl border border-red-500/30 px-4 py-3 font-bold text-red-400 hover:bg-red-500/10 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Reject
            </button>
          </div>
        </Section>
      )}
    </div>
  );
}
