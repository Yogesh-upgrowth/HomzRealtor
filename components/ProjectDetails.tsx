// ================= PropertyDescription.tsx =================

"use client";

type PropertyDescriptionProps = {
  highlights: string[]; // top tags
  bullets: string[]; // dynamic bullet points
};

export default function PropertyDescription({
  highlights,
  bullets,
}: PropertyDescriptionProps) {
  return (
    <section className="max-w-3xl w-full rounded-2xl border p-5 space-y-4">
      <h2 className="text-lg font-semibold">Property Details</h2>

      {/* Highlights */}
      <div className="flex flex-wrap gap-2">
        {highlights.map((item, i) => (
          <span
            key={i}
            className="text-xs border border-yellow-400 text-yellow-600 rounded-full px-3 py-1"
          >
            {item}
          </span>
        ))}
      </div>

      {/* Bullet Points */}
      <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
        {bullets.map((point, i) => (
          <li key={i}>{point}</li>
        ))}
      </ul>

      <button className="text-sm font-medium underline">Read More</button>
    </section>
  );
}

// ================= Usage =================
// <PropertyDescription
//   highlights={[
//     "Reputed Builder",
//     "Safe & Secure Locality",
//     "Luxury lifestyle",
//     "Tasteful Interiors",
//   ]}
//   bullets={[
//     "Priced at 3.75 crore, this semi-furnished residence spans 1975 square feet.",
//     "Residents will enjoy amenities like gymnasium, swimming pool, and more.",
//     "24x7 security staff and intercom systems ensure peace of mind.",
//   ]}
// />