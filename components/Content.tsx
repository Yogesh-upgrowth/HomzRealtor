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
};

const Content: React.FC<ContentSectionProps> = ({
  cardData,
  layout = "normal",
  theme = "normal",
  isButton = false,
  image,
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
        <div className="max-w-7xl mx-auto px-6 pt-8 sm:pt-16 flex flex-col md:flex-row gap-8 items-stretch">
          
          {/* Image */}
          <div
            className={`flex-shrink-0 w-full md:w-1/2 h-full ${imageOrder}`}
          >
            <Image
              className="w-full h-full rounded-lg object-cover"
              src={image}
              alt="About us image"
              width={550}
              height={488}
              priority
            />
          </div>

          {/* Text */}
          <div
            className={`w-full md:w-1/2 h-full flex flex-col justify-center ${textOrder}`}
          >
            <div className="flex items-center gap-4 mb-6">
              <h1
                id="about-heading"
                className="text-xl font-corbert md:text-2xl tracking-wide text-[#212121]"
              >
                {cardData}
              </h1>

              {/* Gradient Line */}
              <div className="md:w-[200px] w-[100px] h-px bg-gradient-to-r md:bg-gradient-to-l from-black/50 to-transparent"></div>
            </div>

            {/* Button */}
            {isButton && (
              <div className="pt-8">
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