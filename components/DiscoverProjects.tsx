"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import discoverImage1 from "@/assets/images/discoverImage1.png";
import discoverImage2 from "@/assets/images/discoverImage2.jpg";
import discoverImage3 from "@/assets/images/discoverImage3.png";
import discoverImage4 from "@/assets/images/discoverImage4.png";
import discoverImage5 from "@/assets/images/discoverImage5.png";
import arrow from "@/assets/images/arrow.png";

const projects = [
  {
    id: 1,
    title: "Buy Property",
    desc: "Explore a wide range of options to buy your dream property with ease and confidence.",
    img: discoverImage1,
  },
  {
    id: 2,
    title: "Rent Property",
    desc: "Choose from various rental options tailored to your preferences and convenience. With transparent agreements and verified listings, moving into your next home has never been easier.",
    img: discoverImage2,
  },
  {
    id: 3,
    title: "Plots & Lands",
    desc: "Find the perfect plot or land for your dream project, investment, or development plan.",
    img: discoverImage3,
  },
  {
    id: 4,
    title: "Projects",
    desc: "Discover curated projects that match your lifestyle and investment goals.",
    img: discoverImage4,
  },
  {
    id: 5,
    title: "Commercial",
    desc: "Unlock commercial spaces designed for growth, visibility, and long-term success.",
    img: discoverImage5,
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
    <div className="flex flex-col w-full max-w-[1444px] mx-auto gap-10 my-10 px-4">
      
      {/* Heading */}
      <div className="w-full flex flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center w-full">
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-black via-gray-400 to-transparent" />

          <h1 className="mx-4 text-2xl md:text-4xl font-corbert font-bold bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent uppercase tracking-wide">
            Discover The Latest Projects
          </h1>

          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-gray-400 to-black" />
        </div>
      </div>

      <p className="mt-3 text-gray-600 text-lg font-sans max-w-3xl mx-auto text-center">
        Explore off-plan and upcoming properties before they hit the mainstream market.
      </p>

      {/* Cards Section */}
      <div className="w-full">

        {/* ✅ MOBILE SLIDER */}
        <div className="block md:hidden relative">
          <div className="relative w-[90%] mx-auto h-[420px] overflow-hidden rounded-xs bg-white/10 backdrop-blur-md shadow-xs">
            <Image
              src={projects[currentIndex].img}
              alt={projects[currentIndex].title}
              fill
              className="object-cover"
            />

            <div className="absolute inset-0 bg-black/30"></div>

            <div className="absolute bottom-0 p-4 text-white">
              <h2 className="text-lg font-semibold text-amber-300">
                {projects[currentIndex].title}
              </h2>

              <p className="text-sm mt-1">
                {projects[currentIndex].desc}
              </p>

              <Link
                href="/project-listing"
                className="inline-block mt-3 px-4 py-2 bg-yellow-500 text-black rounded"
              >
                View More
              </Link>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4 px-2">
            {/* Prev Button */}
            <button
              onClick={prevSlide}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-500 shadow hover:bg-gray-300 transition"
            >
              <Image
                src={arrow}
                alt="Previous"
                width={10}
                height={10}
                className="rotate-180"
              />
            </button>

            {/* Dots Indicator */}
            <div className="flex gap-2">
              {projects.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === currentIndex ? "bg-black scale-110" : "bg-gray-400"
                  }`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={nextSlide}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-yellow-500 shadow hover:bg-yellow-600 transition"
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
            <div
              key={p.id}
              onMouseMove={() => setActive(p.id)}
              className={`relative cursor-pointer transition-all duration-500 ease-in-out overflow-hidden rounded-lg shadow-md group 
              ${
                active === p.id ? "w-[450px]" : "w-[200px]"
              } h-[420px]`}
            >
              <Image
                src={p.img}
                alt={p.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-black/30"></div>

              {active === p.id ? (
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <h2 className="text-[24px] font-semibold text-amber-300">
                    {p.title}
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed">
                    {p.desc}
                  </p>

                  <Link
                    href="/project-listing"
                    className="inline-block mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded"
                  >
                    View More
                  </Link>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-end -mr-10">
                  <h2 className="text-[24px] font-semibold text-white rotate-90 whitespace-nowrap tracking-wider">
                    {p.title}
                  </h2>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}