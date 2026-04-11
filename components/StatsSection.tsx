"use client";

export default function StatsSection() {
  const stats = [
    { value: "25500+", label: "Happy Customers" },
    { value: "45 Million Sq.Ft.", label: "Area Sold" },
    { value: "500+", label: "Skilled Professionals" },
    { value: "750+", label: "Channel Associates" },
  ];

  return (
    <section className="w-full bg-black py-16 px-4 my-16 font-serif">
      <div className="max-w-8xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 text-center gap-16 md:gap-0">
        {stats.map((s, idx) => (
          <div
          key={idx}
          className="flex flex-col items-center justify-center relative px-8"
          >
          {/* Vertical line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-[1px] bg-gradient-to-b from-[#FDF094] to-[#B77D2B]" />
          <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent">
            {s.value}
          </h2>
          <p className="text-gray-300 mt-1 text-sm md:text-base">{s.label}</p>
        </div>
        ))}
      </div>
    </section>
  );
}
