"use client";

import { useContext } from "react";
import Image, { StaticImageData } from "next/image";
import heroFamilyDesktop from "@/assets/images/heroFamilyDesktop.jpg";
import heroFamilyMobile from "@/assets/images/heroFamilyMobile.jpg";
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
    <div className="shadow-[0_30px_60px_rgba(0,0,0,0.55)] md:shadow-none">
    <section className="relative overflow-hidden">
      {/* Background image — z-0, covers the entire section (grows with content).
          Two distinct photos, not one photo cropped two ways — mobile gets its
          own portrait shot instead of a portrait slice of the desktop crop. */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <Image
          src={heroFamilyDesktop}
          alt="A happy family at home in Gurgaon"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 z-0 md:hidden">
        <Image
          src={heroFamilyMobile}
          alt="A happy family at home in Gurgaon"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Gradient overlay — z-0, sits above image but below content. Two
          stacked gradients exactly matching the reference's `.hero-media::after`:
          a vertical fade darkening toward the bottom (for the text sitting
          there) plus a horizontal fade darkening toward the left (where the
          text actually is), fading out toward the right. Same on every
          breakpoint — the reference has no mobile-specific override for this. */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(11,11,12,0.15) 0%, rgba(11,11,12,0.35) 40%, rgba(11,11,12,0.96) 92%), linear-gradient(90deg, rgba(11,11,12,0.85) 0%, rgba(11,11,12,0.25) 55%, rgba(11,11,12,0.05) 100%)",
        }}
      />

      {/* Content — z-10, sits above the image on all screen sizes.
          min-h is 0 on mobile (matches the reference exactly: .hero{
          min-height:0 } under its <=768px breakpoint) — the hero's height on
          mobile is purely content-driven, so the absolutely-positioned image
          behind it never has to stretch/zoom far beyond its natural crop.
          The tall clamp only applies from md: up, same as the reference's
          desktop-only min-height clamp. */}
      <div className="relative z-10 mx-auto flex min-h-0 max-w-7xl flex-col justify-end px-4 pb-14 pt-32 md:min-h-[clamp(560px,88vh,780px)] md:px-6">
        <span className="mb-5 inline-flex w-fit items-center gap-[5px] rounded-full border border-white/[0.12] bg-black/35 px-[11px] py-1.5 text-[10.5px] font-bold uppercase tracking-[0.6px] text-[#F5F4F2] backdrop-blur-[6px] md:px-3 md:text-[11px]">
          #1 Trusted Property Platform in Gurgaon
        </span>

        <h1 className="mb-4 max-w-[16ch] text-balance text-[clamp(27px,7.4vw,36px)] font-extrabold uppercase leading-[1.08] tracking-tight text-white md:text-wrap md:text-[clamp(34px,6.4vw,68px)] md:leading-[1.04]">
          Homes you can trust,{" "}
          <span className="bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] bg-clip-text text-transparent">
            in the city you love.
          </span>
        </h1>

        <p className="mb-7 max-w-[34ch] text-[14.5px] leading-[1.65] text-[#c4c3c0] md:max-w-[480px] md:text-[15.5px] md:leading-[1.75]">
          Buy, rent or sell — discover verified listings, expert guidance, and
          properties that feel like home.
        </p>

        <QuickSearchPanel />

        {/* Trust stats — overlaid on the hero photo like the rest of this
            content, not a separate section below it. 2 rows of 2 on
            mobile instead of a cramped 4-across row; one baseline-aligned
            row again from sm: up. */}
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-6 sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-9 sm:gap-y-3">
          {TRUST_STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
              <span className="font-display text-[19px] text-gray-200 sm:text-xl">{s.value}</span>
              <span className="text-[11.5px] text-gray-500 sm:text-[12.5px]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
    </div>
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
