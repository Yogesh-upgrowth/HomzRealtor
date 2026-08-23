"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import discoverImage1 from "@/assets/images/discoverImage1.jpg";
import discoverImage2 from "@/assets/images/discoverImage2.jpg";
import discoverImage3 from "@/assets/images/discoverImage3.jpg";
import discoverImage4 from "@/assets/images/discoverImage4.jpg";
import discoverImage5 from "@/assets/images/discoverImage5.jpg";
import arrow from "@/assets/images/arrow.png";

const projects = [
  {
    id: 1,
    title: "Buy Property",
    desc: "Explore a wide range of options to buy your dream property with ease and confidence.",
    img: discoverImage1,
    href: "/buy-property",
  },
  {
    id: 2,
    title: "Rent Property",
    desc: "Choose from various rental options tailored to your preferences and convenience. With transparent agreements and verified listings, moving into your next home has never been easier.",
    img: discoverImage2,
    href: "/rent-property",
  },
  {
    id: 3,
    title: "Plots & Lands",
    desc: "Find the perfect plot or land for your dream project, investment, or development plan.",
    img: discoverImage3,
    href: "/plots-and-lands",
  },
  {
    id: 4,
    title: "Projects",
    desc: "Discover curated projects that match your lifestyle and investment goals.",
    img: discoverImage4,
    href: "/project-listing",
  },
  {
    id: 5,
    title: "Commercial",
    desc: "Unlock commercial spaces designed for growth, visibility, and long-term success.",
    img: discoverImage5,
    href: "/commercial",
  },
];

export default function DiscoverProject() {
  const [active, setActive] = useState(2); // desktop active card
  const [currentIndex, setCurrentIndex] = useState(0); // mobile slider

  // Mobile handlers
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % projects.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? projects.length - 1 : prev - 1
    );
  };

  return (
    <section className="flex flex-col w-full max-w-7xl mx-auto gap-10 py-14 md:py-20 px-4 border-b border-white/[0.06]">
      
      {/* Heading */}
      <div className="w-full flex flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center w-full">
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-white/30 via-white/10 to-transparent" />

          <h2 className="mx-4 text-2xl md:text-4xl font-display font-bold bg-gradient-to-b from-[#F2D79B] to-[#C99A4B] bg-clip-text text-transparent uppercase tracking-wide">
            Discover The Latest Projects
          </h2>

          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-white/30" />
        </div>
      </div>

      <p className="mt-3 text-gray-400 text-lg font-sans max-w-3xl mx-auto text-center">
        Explore off-plan and upcoming properties before they hit the mainstream market.
      </p>

      {/* Cards Section */}
      <div className="w-full">

        {/* ✅ MOBILE SLIDER */}
        <div className="block md:hidden relative">
          <Link
            href={projects[currentIndex].href}
            className="relative block w-[90%] mx-auto h-[420px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#141416] shadow-xl"
          >
            <Image
              src={projects[currentIndex].img}
              alt={projects[currentIndex].title}
              fill
              sizes="90vw"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-black/30"></div>

            <div className="absolute bottom-0 p-4 text-white">
              {/* Sub-item of this section's own h2 ("Discover The Latest
                  Projects") — h3, not a sibling h2. */}
              <h3 className="text-lg font-semibold text-[#D9B268]">
                {projects[currentIndex].title}
              </h3>

              <p className="text-sm mt-1">
                {projects[currentIndex].desc}
              </p>

              <span className="inline-block mt-3 px-4 py-2 bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] text-[#1c1608] font-semibold rounded">
                View More
              </span>
            </div>
          </Link>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4 px-2">
            {/* Prev Button */}
            <button
              onClick={prevSlide}
              aria-label="Previous project"
              className="w-11 h-11 flex items-center justify-center rounded-md border border-white/10 text-white hover:border-[#D9B268] transition"
            >
              <Image
                src={arrow}
                alt="Previous"
                width={10}
                height={10}
                className="rotate-180 invert"
              />
            </button>

            {/* Dots Indicator */}
            <div className="flex gap-2">
              {projects.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === currentIndex ? "bg-[#D9B268] scale-110" : "bg-white/20"
                  }`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={nextSlide}
              aria-label="Next project"
              className="w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] shadow hover:brightness-105 transition"
            >
              <Image
                src={arrow}
                alt="Next"
                width={10}
                height={10}
              />
            </button>
          </div>
        </div>

        {/* ✅ DESKTOP EXPANDING CARDS */}
        <div className="hidden md:flex flex-row gap-6">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              onMouseMove={() => setActive(p.id)}
              className={`relative block cursor-pointer transition-all duration-500 ease-in-out overflow-hidden rounded-lg shadow-md group
              ${
                active === p.id ? "w-[450px]" : "w-[200px]"
              } h-[420px]`}
            >
              <Image
                src={p.img}
                alt={p.title}
                fill
                sizes="450px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-black/30"></div>

              {active === p.id ? (
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <h3 className="text-[24px] font-semibold text-[#D9B268]">
                    {p.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed">
                    {p.desc}
                  </p>

                  <span className="inline-block mt-4 px-4 py-2 bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] group-hover:brightness-105 text-[#1c1608] font-semibold rounded">
                    View More
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-end -mr-10">
                  <h3 className="text-[24px] font-semibold text-white rotate-90 whitespace-nowrap tracking-wider">
                    {p.title}
                  </h3>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}