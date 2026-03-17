"use client";

import { useState } from "react";
import Image from "next/image";
import discoverImage1 from "@/assets/images/discoverImage1.png";
import discoverImage2 from "@/assets/images/discoverImage2.jpg";
import discoverImage3 from "@/assets/images/discoverImage3.png";
import discoverImage4 from "@/assets/images/discoverImage4.png";
import discoverImage5 from "@/assets/images/discoverImage5.png";
import Link from "next/link";

// ... any other imports like React, Image, etc.

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
  const [active, setActive] = useState(2); // default open card
  // const router = useRouter();

  return (
    <div className="flex flex-col w-full max-w-[1227px] mx-auto gap-10 my-10 px-4">
      {/* Heading */}
      <div className="w-full flex flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center w-full">
          {/* Left line */}
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-black via-gray-400 to-transparent" />

          {/* Text */}
          <h1 className="mx-4 text-2xl md:text-4xl font-corbert font-bold bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent text-center uppercase tracking-wide">
            Discover The Latest Projects
          </h1>

          {/* Right line */}
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-gray-400 to-black" />
        </div>
      </div>
      <p className="mt-3 text-gray-600  text-lg font-sans max-w-3xl mx-auto">
        Explore off-plan and upcoming properties before they hit the mainstream
        market.
      </p>

      {/* Cards */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {projects.map((p) => (
          <div
            key={p.id}
            onMouseMove={() => setActive(p.id)}
            className={`relative cursor-pointer transition-all duration-500 ease-in-out overflow-hidden rounded-lg shadow-md group 
              ${
                active === p.id ? "w-full md:w-[450px]" : "w-full md:w-[200px]"
              } h-[280px] md:h-[420px]`}
          >
            {/* Background Image */}
            <Image
              src={p.img}
              alt={p.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30"></div>

            {active === p.id ? (
              // Expanded card content
              <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6 text-white">
                <h2 className="text-xl md:text-[24px] font-semibold text-amber-300 ">
                  {p.title}
                </h2>
                <p className="mt-2 text-md md:text-sm leading-relaxed">
                  {p.desc}
                </p>

                <Link
                  href="/project-listing"
                  className="inline-block mt-3 md:mt-4 px-3 md:px-4 py-1.5 md:py-2 bg-yellow-500 text-center hover:bg-yellow-600 text-black font-medium rounded cursor-pointer text-sm md:text-base"
                >
                  View More
                </Link>
              </div>
            ) : (
              // Collapsed card text (vertical)
              <div className="absolute inset-0 flex items-center justify-center md:justify-end md:-mr-10">
                <h2 className="text-base md:text-[24px] font-semibold text-white md:rotate-90 whitespace-nowrap tracking-wider">
                  {p.title}
                </h2>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
