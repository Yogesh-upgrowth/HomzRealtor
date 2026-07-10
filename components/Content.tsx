import Image, { StaticImageData } from "next/image";
import React from "react";

type FeatureItem = {
  id: number | string;
  text: string;
};

type Para1 = {
  text1?: string;
  text2?: string;
};

type DetailedFeatureItem = {
  id: number;
  icon: string | StaticImageData;
  title: string;
  description: string;
};

type AboutCardData = {
  title: string;
  para1?: Para1;
  para2?: string;
  subtitle?: string;
  para3?: string;
  features?: FeatureItem[] | DetailedFeatureItem[];
  imageSrc: StaticImageData | string;
  imageAlt: string;
  highlightedText?: string;
  btnTxt?: string;
};

type ContentSectionProps = {
  cardData: string;
  layout?: "normal" | "reversed" | "imageLayout";
  theme?: "normal" | "dark";
  txtBold?: boolean;
  isButton?: boolean;
  image: StaticImageData | string;
  price?: string;
  units?: string;
  area?: string;
  cardDescription?: string;
};

const Content: React.FC<ContentSectionProps> = ({
  cardData,
  layout = "normal",
  theme = "normal",
  isButton = false,
  image,
  price,
  units,
  area,
  cardDescription,
}) => {
  const imageOrder =
    layout === "reversed"
      ? "md:order-last"
      : layout === "imageLayout"
      ? "md:order-first"
      : "";

  const textOrder =
    layout === "reversed"
      ? "md:order-first"
      : layout === "imageLayout"
      ? "md:order-last"
      : "";

  // IMAGE LAYOUT (ABOUT SECTION)
  if (layout === "imageLayout") {
  return (
    <section className="flex flex-col gap-12 md:gap-16">
      <div className="max-w-7xl mx-auto px-6 pt-8 sm:pt-16 flex flex-col md:flex-row gap-8 items-stretch min-h-[300px] md:min-h-[420px]">
        
        {/* Image */}
        <div
          className={`flex-shrink-0 w-full md:w-1/2 relative ${imageOrder}`}
        >
          <Image
            src={image}
            alt="About us image"
            fill
            className="object-cover rounded-lg"
            priority
          />
        </div>

        {/* Text */}
        <div
          className={`w-full md:w-1/2 flex flex-col justify-center ${textOrder}`}
        >
          <div className="flex flex-col items-center md:items-start gap-3 mb-6 text-center md:text-left">

            {/* Title */}
            <h2
              id="about-heading"
              className="text-xl md:text-2xl font-corbert tracking-wide text-[#212121]"
            >
              {cardData}
            </h2>

            <p className="text-base md:text-lg text-[#212121]">
              {cardDescription}
            </p>

            {/* Details */}
            <div className="flex flex-col gap-2">
              <p className="text-base md:text-2xl font-bold text-[#CEA44E]">
                {"Price : "} {price}
              </p>

              <ul className="list-disc pl-5 text-left">
                <li className="text-base md:text-md text-[#212121]">
                  {units}
                </li>
                <li className="text-base md:text-md text-[#212121]">
                  {area}
                </li>
              </ul>
            </div>
          </div>

          {/* Button */}
          {isButton && (
            <div className="pt-6">
              <button
                aria-label="Contact us now"
                className="w-full sm:w-[220px] h-[48px] rounded-md px-6 py-3 font-medium text-black 
                bg-gradient-to-b from-[#fdf094] to-[#b77d2b] hover:opacity-90 transition cursor-pointer"
              >
                Contact Now
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

  return null;
};

export default Content;