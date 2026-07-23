"use client";

import { StaticImageData } from "next/image";
import React, { useContext } from "react";
import { FormContext } from "@/context/FormContext";

type AppointmentProps = {
  heading: string;
  para: string;
  btnTxt?: string;
  bgImage?: StaticImageData | string;
};

const AppointmentCard: React.FC<AppointmentProps> = ({
  heading,
  para,
  btnTxt = "Schedule Site Visit",
  bgImage,
}) => {
  const { openForm } = useContext(FormContext);
  const backgroundImageUrl =
    typeof bgImage === "string" ? bgImage : bgImage?.src;
  return (
    <section
      className="relative bg-center bg-cover py-16 px-4 text-center text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(246, 215, 185, 0.8), #B67E2BE0), url(${backgroundImageUrl})`,
      }}
    >
      <div className="max-w-2xl mx-auto">
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
