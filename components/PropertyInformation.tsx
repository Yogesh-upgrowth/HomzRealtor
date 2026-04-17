// ================= PropertyInformation.tsx =================

"use client";

type InfoItem = {
  label: string;
  value: string;
};

export type PropertyInformationProps = {
  items: InfoItem[]; // fully dynamic
};

export default function PropertyInformation({ items }: PropertyInformationProps) {
  return (
    <section className="w-full max-w-5xl rounded-2xl border p-5 space-y-4">
      <h2 className="text-lg font-semibold">Property Information</h2>

      <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5 text-sm">
        {items.map((item, i) => (
          <div key={i} className="pb-2 border-b">
            <dt className="text-gray-500">{item.label}</dt>
            <dd className="font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ================= Usage =================
// <PropertyInformation
//   items={[
//     { label: "Listing Type", value: "Sale" },
//     { label: "Building Type", value: "Residential" },
//     { label: "Property Type", value: "Apartment" },
//     { label: "City", value: "Gurgaon" },
//     { label: "Micro market", value: "Golf Course Extension" },
//     { label: "Locality", value: "Sector 65" },
//     { label: "Project", value: "Emaar Emerald Floors" },
//     { label: "Price", value: "3.75 Cr." },
//     { label: "Area", value: "1975 Sq.Ft." },
//     { label: "View", value: "Park View" },
//     { label: "Balcony", value: "Connected" },
//     { label: "Flooring", value: "Marble" },
//     { label: "Total Floor Count", value: "5" },
//     { label: "Tower/Block", value: "15" },
//     { label: "Unit No", value: "001" },
//   ]}
// />