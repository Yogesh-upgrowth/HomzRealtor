"use client";

import Image, { StaticImageData } from "next/image";
import React, { useContext } from "react";
import { FormContext } from "@/context/FormContext";

type AppointmentProps = {
  heading: string;
  para: string;
  btnTxt?: string;
  bgImage?: StaticImageData | string;
};

// This card sits at the bottom of nearly every content page — almost always
// below the fold. As a CSS background-image it loaded eagerly and
// unconditionally on every page render, with no lazy-loading at all (CSS
// backgrounds aren't lazy-loadable the way an <img> is). Routing it through
// next/image gets real lazy-loading (it won't even fetch until scrolled
// into view) for free. Kept `unoptimized`, matching the same bundled-static-
// asset convention as discoverImage2-5 (see components/Home/Collections.tsx)
// — this app already hit Vercel's metered image-optimization quota once
// from resizing bundled photos at every breakpoint; this avoids adding a new
// source image to that quota rather than risk repeating it.
const AppointmentCard: React.FC<AppointmentProps> = ({
  heading,
  para,
  btnTxt = "Schedule Site Visit",
  bgImage,
}) => {
  const { openForm } = useContext(FormContext);
  return (
    <section className="relative overflow-hidden py-16 px-4 text-center text-white">
      {bgImage && (
        <Image
          src={bgImage}
          alt=""
          fill
          unoptimized
          sizes="100vw"
          className="object-cover -z-20"
        />
      )}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(rgba(246, 215, 185, 0.8), #B67E2BE0)" }}
      />
      <div className="relative max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-wide">
          {heading}{" "}
        </h2>
        <p className="text-base md:text-lg mb-8 opacity-90">{para}</p>
        {btnTxt && (
          <button
            onClick={openForm}
            className="bg-white text-gray-800 font-semibold px-6 py-3 rounded-md hover:bg-gray-200 transition cursor-pointer"
          >
            {btnTxt.toUpperCase()}
          </button>
        )}
      </div>
    </section>
  );
};

export default AppointmentCard;
