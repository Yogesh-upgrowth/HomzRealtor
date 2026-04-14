// ================= PropertyDetailsCard.tsx =================

"use client";

type Item = {
  label: string;
  value: string;
};

export type PropertyDetailsProps = {
  price: string;
  items: Item[]; // flexible, data-driven
  updated: string;
};

export default function PropertyDetailsCard({
  price,
  items,
  updated,
}: PropertyDetailsProps) {
  return (
    <section className="max-w-md w-full rounded-2xl border p-4 space-y-4">
      {/* Price */}
      <h2 className="text-2xl font-semibold">₹ {price}</h2>

      {/* Details */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
        {items.map((item, i) => (
          <div key={i} className="space-y-1">
            <dt className="text-gray-500">{item.label}</dt>
            <dd className="font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>

      {/* Updated */}
      <p className="text-xs text-gray-500">Updated {updated}</p>
    </section>
  );
}

// ================= Usage =================
// <PropertyDetailsCard
//   price="3.75 Cr."
//   items={[
//     { label: "Area", value: "1975 Sq.Ft." },
//     { label: "Bedroom", value: "4 Bedrooms" },
//     { label: "Additional Spaces", value: "Servant Room +1" },
//     { label: "Bath", value: "4 Bathrooms" },
//     { label: "View", value: "Park View" },
//     { label: "Possession Status", value: "Ready To Move" },
//   ]}
//   updated="22 hours ago"
// />