// components/HotSellingProjects.tsx
"use client";

import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import kraheja from "@/assets/images/kraheja.png";
import dlf from "@/assets/images/dlf.png";
import mahindramarina from "@/assets/images/mahindramarina.png";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

interface Project {
  id: number;
  title: string;
  location: string;
  priceRange: string;
  image: StaticImageData | StaticImport;
  link: string;
}

const projects: Project[] = [
  {
    id: 1,
    title: "DLF The Westpark",
    location: "Andheri West, Delhi NCR",
    priceRange: "₹ 4.20 Cr to 9.63 Cr",
    image: dlf,
    link: "/projects/dlf-the-westpark",
  },
  {
    id: 2,
    title: "K Raheja Antares",
    location: "Kanjurmarg West, Delhi NCR",
    priceRange: "₹ 4.20 Cr to 9.63 Cr",
    image: kraheja,
    link: "/projects/k-raheja-antares",
  },
  {
    id: 3,
    title: "Mahindra Marina 64",
    location: "Malad West, Delhi NCR",
    priceRange: "₹ 9.04 Cr to 14.23 Cr",
    image: mahindramarina,
    link: "/projects/mahindra-marina-64",
  },
];

export default function HotSelling() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 text-center mt-8">
        {/* Heading */}
        <div className="flex items-center justify-center w-full">
          {/* Left line */}
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-black via-gray-400 to-transparent" />

          {/* Text */}
          <h1 className="mx-4 text-2xl md:text-4xl font-corbert font-bold bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent text-center uppercase tracking-wide">
            Hot Selling Real Estate Projects <br />
            Delhi NCR
          </h1>

          {/* Right line */}
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-gray-400 to-black" />
        </div>
        <p className="mt-3 text-gray-600  text-lg font-sans max-w-3xl mx-auto">
          Discover the Best Opportunities in Residential & Commercial Spaces
        </p>

        {/* Project Cards */}
        <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="group overflow-hidden rounded-md border-0 shadow-sm hover:shadow-lg transition"
            >
              <div className="relative h-60 w-full">
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  className="object-cover group-hover:scale-105 transition"
                />
              </div>
              <div className="py-4 pl-6 text-left">
                <h3 className="text-lg font-semibold text-gray-900 py-2">
                  {p.title}
                </h3>
                <p className="text-sm text-gray-600 py-1">{p.location}</p>
                <p className="mt-2 text-purple-700 font-semibold">
                  {p.priceRange}
                </p>
                <Link
                  href={p.link}
                  className="mt-3 inline-flex items-center text-sm text-gray-900 font-medium hover:underline"
                >
                  Read more <span className="ml-1">›</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-10">
          <Link
            href="/project-listing"
            className="px-12 py-4 bg-gradient-to-b from-[#FDF094] to-[#B77D2B] text-black font-medium rounded-md shadow-md hover:opacity-90 transition"
          >
            View All
          </Link>
        </div>
      </div>
    </section>
  );
}
