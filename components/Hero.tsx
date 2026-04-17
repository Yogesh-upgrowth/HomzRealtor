// app/page.tsx
"use client";

import React, { useContext } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import lodha from "@/assets/companylogo/lodha.png";
import kalpataru from "@/assets/companylogo/kalpataru.png";
import logoipsum from "@/assets/companylogo/logoipsum.png";
import sarvome from "@/assets/companylogo/sarvome.png";
import rentIcon from "@/assets/images/rentIcon.png";
import propertyIcon from "@/assets/images/propertyIcon.png";
import plotLandIcon from "@/assets/images/plot&landIcon.png";
import projectsIcon from "@/assets/images/projectsIcon.png";
import commercialIcon from "@/assets/images/commercialIcons.png";
import herobg from "@/assets/images/herobg.png";
import { FormContext } from "@/context/FormContext";

type Feature = {
  label: string;
  href: string;
  icon: StaticImageData;
};

const features: Feature[] = [
  { label: "Buy Property", href: "/", icon: propertyIcon },
  { label: "Rent Property", href: "/", icon: rentIcon },
  { label: "Plots & Land", href: "/", icon: plotLandIcon },
  { label: "Projects", href: "/project-listing", icon: projectsIcon },
  { label: "Commercial", href: "/", icon: commercialIcon },
];

const brandLogos = [kalpataru, lodha, sarvome, logoipsum, lodha];

// export default function Hero() {
//   const {openForm} = useContext(FormContext);
//   return (
//     <main className="min-h-screen bg-black text-white">
//       {/* HERO */}
//       <section className="relative isolate overflow-hidden rounded-b-3xl bg-white">
//         {/* Background image */}
//         <div className="absolute inset-0 -z-10">
//           <Image
//             src={herobg}
//             alt="Modern city apartments"
//             fill
//             priority
//             className="object-cover"
//           />
//           {/* Dark overlay */}
//           <div className="absolute inset-0 bg-black/55" />
//         </div>

//         {/* Content */}
//         <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 pt-28 pb-20 md:pb-28 text-center">
//           <h1 className="text-2xl sm:text-3xl md:text-6xl font-normal tracking-wide leading-tight md:pt-10">
//             <span className="block font-sans">HOMES YOU CAN TRUST, IN THE</span>
//             <span className="mt-2 block  font-sans bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent">
//               CITY YOU LOVE.
//             </span>
//           </h1>

//           <p className="mx-auto mt-5 max-w-3xl text-gray-200/90">
//             Buy, Rent, or Sell—discover verified listings, expert guidance, and properties that feel like home.
//           </p>

//           {/* Feature cards */}
//           <div className="mx-auto mt-10 grid w-full max-w-[1444px] grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 justify-items-center">
//             {features.map((f) => (
//                 <Link
//                 key={f.label}
//                 href={f.href}
//                 className="group relative flex items-center gap-4 rounded-sm border border-amber-200 px-4 py-3 bg-transparent transition hover:bg-white/15 w-full max-w-[238px] h-[80px]"
//                 >
//                 <div className="flex items-center gap-4">
//                     <span className="grid place-items-center rounded-sm text-amber-300">
//                     <Image src={f.icon} alt="image" width={32} height={32} />
//                     </span>
//                     <span className="text-md font-semibold">{f.label}</span>
//                 </div>
//                 </Link>
//             ))}
//             </div>

//           {/* CTA */}
//           <div className="mt-14">
//             <button
//               onClick={openForm}
//               className="inline-flex items-center rounded-md bg-white px-8 py-4 text-md font-bold tracking-wide text-gray-900 shadow-lg transition hover:shadow-xl cursor-pointer "
//             >
//               TALK TO A LOCAL EXPERT
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* Trusted by strip */}
//       <section className="bg-[#0E0E0E] rounded-b-3xl">
//         <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-10">
//           <p className="text-center text-gray-400 text-lg">
//             Trusted by the world’s best companies—social proof to build credibility.
//           </p>
//           <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 items-center">
//             {brandLogos.map((src, i) => (
//               <div key={i} className="flex items-center justify-center opacity-80 hover:opacity-100 transition">
//                 <Image
//                   src={src}
//                   alt={`Brand ${i + 1}`}
//                   width={140}
//                   height={40}
//                   className="h-8 w-auto object-contain"
//                 />
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// }
//  ------------------------------------------------------------------ dynamic conponent ------------------------------------------------

export default function Hero({
  variant,
  propertyDetails,
}: {
  variant: "default" | "image-centric";
  propertyDetails?: {
    name: string;
    location: string;
    rera: string;
    price: string;
    possession: string;
    config: string;
    imageUrl: string | StaticImageData;
  };
}) {
  const { openForm } = useContext(FormContext);
  return (
    <>
      {variant === "default" ? (
        <main className="min-h-screen bg-black text-white">
          {/* HERO */}
          <section className="relative isolate overflow-hidden  bg-white">
            {/* Background image */}
            <div className="absolute inset-0 -z-10 rounded-b-5xl border-amber-50">
              <Image
                src={herobg}
                alt="Modern city apartments"
                fill
                priority
                className="object-cover"
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/55" />
            </div>

            {/* Content */}
            <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 pt-28 pb-20 md:pb-28 text-center md:translate-y-40">
              <h1 className="text-2xl sm:text-3xl md:text-6xl font-normal tracking-wide leading-tight md:pt-10">
                <span className="block font-sans">
                  HOMES YOU CAN TRUST, IN THE
                </span>
                <span className="mt-2 block  font-sans bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent">
                  CITY YOU LOVE.
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-3xl text-gray-200/90">
                Buy, Rent, or Sell—discover verified listings, expert guidance,
                and properties that feel like home.
              </p>

              {/* Feature cards */}
              <div className="flex flex-col">

              {/* CTA */}
              <div className="md:mt-6 mt-14 order-1 md:order-2">
                <button
                  onClick={openForm}
                  className="inline-flex items-center md:mb-15 rounded-md bg-white px-8 py-4 text-md font-bold tracking-wide text-[#754E1A] shadow-lg transition hover:shadow-xl cursor-pointer"
                >
                  TALK TO A LOCAL EXPERT
                </button>
              </div>

              {/* Grid */}
              <div className="mx-auto mt-10 grid w-full max-w-[1544px] grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-6 justify-items-center order-2 md:order-1">
                {features.map((f) => (
                  <Link
                      key={f.label}
                      href={f.href}
                      className="group relative flex items-center gap-4 rounded-sm border border-amber-200 px-4 py-3 transition bg-black/30 opacity-100 w-full max-w-[238px] h-[60px] md:h-[65px]"
                    >
                      <div className="flex items-center gap-4">
                        <span className="grid place-items-center rounded-sm text-amber-300">
                          <Image
                            src={f.icon}
                            alt="image"
                            width={32}
                            height={32}
                          />
                        </span>
                        <span className="text-md font-semibold">{f.label}</span>
                      </div>
                    </Link>
                ))}
              </div>
            </div>
            </div>
          </section>

          {/* Trusted by strip */}
          <section className="bg-[#0E0E0E] rounded-b-3xl">
            <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-10">
              <p className="text-center text-gray-400 text-lg">
                Trusted by the world’s best companies—social proof to build
                credibility.
              </p>
              <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 items-center">
                {brandLogos.map((src, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center opacity-80 hover:opacity-100 transition"
                  >
                    <Image
                      src={src}
                      alt={`Brand ${i + 1}`}
                      width={140}
                      height={40}
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      ) : (
        //  IMAGE-CENTRIC LAYOUT
        <main className="overflow-x-hidden">
          <section className="relative h-screen w-full text-white">
            {/* Background Image */}
            <Image
              src={propertyDetails?.imageUrl || "/istockphoto.svg"} // Placeholder image
              alt={propertyDetails?.name || "Property background"}
              fill
              className="object-cover rounded-b-lg"
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Main Content Container */}
            <div className="absolute bottom-0 left-0 z-10 w-full p-6 md:p-12 flex flex-col items-start">
              {/* Bottom-left Content Box */}
              <div className=" md:max-w-2xl bg-black/70 p-8 font-corbert mb-4">
                <h1 className="mt-4 text-2xl md:text-4xl font-semibold uppercase tracking-wider text-white">
                  {/* */}
                  <span>ZDLF THE WESTPARK </span>
                  <span className="text-2xl md:text-4xl bg-gradient-to-r from-[#FDF094] to-[#B77D2B] inline-block text-transparent bg-clip-text border-b-1 border-amber-400 pb-1">
                    ANDHERI WEST, MUMBAI
                  </span>
                </h1>

                <div className="pt-6 text-base text-gray-200">
                  <p className="mb-4">
                    {propertyDetails?.rera || "RERA No: P123456789"}
                  </p>
                  <hr className="bg-white h-0.5" /> <br />
                  <div className="flex flex-wrap items-center gap-y-2 divide-x divide-gray-100">
                    <span className="pr-4">
                      {propertyDetails?.price || "INR 2.50 Cr. onwards"}
                    </span>
                    <span className="px-4">
                      {propertyDetails?.possession || "Possession March 2025"}
                    </span>
                    <span className="pl-4">
                      {propertyDetails?.config || "3/4 BHK"}
                    </span>
                  </div>
                </div>
              </div>
              {/* Bottom Breadcrumbs */}
              <div className="text-sm">
                <p>Home &gt; Cities &gt; Kharadi IT Park</p>
              </div>
            </div>

            {/* Vertical "Enquire Now" Button */}
            <button
              onClick={openForm}
              className=" hidden md:block md:absolute top-1/2 right-0 z-30 -translate-y-1/2 -rotate-90 origin-bottom-right whitespace-nowrap bg-white px-8 py-3 text-sm font-bold tracking-widest text-[#B7802D] cursor-pointer hover:bg-gray-200"
            >
              ENQUIRE NOW
            </button>
          </section>
        </main>
      )}
    </>
  );
}
