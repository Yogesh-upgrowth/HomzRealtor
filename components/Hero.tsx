"use client";

import React, { useContext } from "react";
import Image, { StaticImageData } from "next/image";
import heroFamily from "@/assets/images/heroFamily.jpg";
import { FormContext } from "@/context/FormContext";
import QuickSearchPanel from "@/components/Home/QuickSearchPanel";

const TRUST_STATS = [
  { value: "25,500+", label: "Happy Customers" },
  { value: "45 Mn+", label: "Sq.ft. Area Sold" },
  { value: "500+", label: "Skilled Professionals" },
  { value: "750+", label: "Channel Associates" },
];

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
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={heroFamily}
              alt="A happy family at home in Gurgaon"
              fill
              priority
              sizes="100vw"
              className="object-cover"
              // The top ~1/3 of this photo is empty wall/gallery-frame space
              // above the family. Anchored at 68%, nudged up 200px, then back
              // down 60px — net shift keeps their heads with headroom while
              // pulling the crop a bit further down the source photo again.
              style={{ objectPosition: "center calc(68% - 140px)" }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0C]/60 via-[#0B0B0C]/20 to-[#0B0B0C]" />

          <div className="relative mx-auto flex min-h-[clamp(560px,88vh,780px)] max-w-7xl flex-col justify-end px-4 pb-14 pt-32 md:px-6">
            <span className="mb-5 inline-flex w-fit items-center rounded-full border border-white/15 bg-black/40 px-4 py-2 text-[12px] font-bold text-gray-100 backdrop-blur-sm">
              Trusted by 25,500+ buyers across Gurgaon
            </span>

            <h1 className="mb-4 max-w-[16ch] text-[clamp(34px,6.4vw,68px)] font-extrabold uppercase leading-[1.04] tracking-tight text-white">
              Homes you can trust,{" "}
              <span className="bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] bg-clip-text text-transparent">
                in the city you love.
              </span>
            </h1>

            <p className="mb-7 max-w-[480px] text-[15.5px] leading-relaxed text-gray-300">
              Buy, rent or sell — discover verified listings, expert guidance, and
              properties that feel like home.
            </p>

            <QuickSearchPanel />

            <div className="mt-7">
              <button
                onClick={openForm}
                className="w-full rounded-full bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-5 py-2.5 text-[13px] font-bold text-[#1c1608] hover:brightness-105 transition cursor-pointer md:w-auto md:py-2"
              >
                Talk to a Local Expert
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-9 gap-y-3 border-t border-white/10 pt-6">
              {TRUST_STATS.map((s) => (
                <div key={s.label} className="flex items-baseline gap-2">
                  <span className="font-display text-xl text-gray-200">{s.value}</span>
                  <span className="text-[12.5px] text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        //  IMAGE-CENTRIC LAYOUT
        <main className="overflow-x-hidden">
          <section className="relative h-screen w-full text-white">
            {/* Background Image */}
            <Image
              src={propertyDetails?.imageUrl || "/istockphoto.svg"} // Placeholder image
              alt={propertyDetails?.name || "Property background"}
              fill
              sizes="100vw"
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
