import Image, { StaticImageData } from "next/image";
import { features } from "process";
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
  cardData: AboutCardData;
  layout?: "normal" | "reversed" | "imageLayout";
  theme?: "normal" | "dark";
  txtBold?: boolean;
  isButton?: boolean;
};

const ContentSection: React.FC<ContentSectionProps> = ({
  cardData,
  layout = "normal",
  theme = "normal",
  isButton = false,
}) => {
  // column order for image/text
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

  // imageLayout ABOUT US layout

  if (layout === "imageLayout") {
    return (
      <section className="flex flex-col gap-12 md:gap-16">
        <div className="max-w-7xl mx-auto px-6 pt-8 sm:pt-16 flex flex-col md:flex-row gap-8 items-center">
          {/* Image */}
          <div className="flex-shrink-0 w-full md:w-1/2">
            <Image
              className="w-full h-auto rounded-lg object-cover"
              src={cardData.imageSrc}
              alt={cardData.imageAlt}
              width={550}
              height={488}
              priority
            />
          </div>

          {/* Text */}
          <div className="w-full md:w-1/2">
            <div className="flex items-center gap-4 mb-6">
              <h1
                id="about-heading"
                className="text-3xl font-corbert md:text-4xl font-bold tracking-wide text-[#212121]"
              >
                {cardData.title}
              </h1>
              {/* black to transparent line */}
              <div className="md:w-[200px] w-[100px] h-px bg-gradient-to-r md:bg-gradient-to-l from-black/50 to-transparent"></div>
            </div>

            <p className="mb-4 text-gray-700 leading-relaxed">
              {cardData.para1?.text1 ?? cardData.para2}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {cardData.para1?.text2}
            </p>

            {/* Conditional button */}
            {isButton && (
              <div className="pt-8">
                <button
                  aria-label="Contact us now"
                  className="w-full sm:w-[220px] h-[48px] rounded-md px-6 py-3 font-medium text-black 
                  bg-gradient-to-b from-[#fdf094] to-[#b77d2b] hover:opacity-90 transition cursor-pointer"
                >
                  {cardData.btnTxt ?? "Contact Now"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // reversed (OUR STORY Layout)

  if (layout === "reversed") {
    const detailedFeatures = cardData.features as DetailedFeatureItem[];
    return (
      <section
        className={`${
          theme === "dark" ? "bg-black text-white" : "bg-white text-black"
        } py-16 px-6 lg:px-28`}
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-corbert font-bold mb-3">
            {cardData.title || "OUR STORY"}
          </h2>
          <p className=" max-w-3xl text-center mx-auto">{cardData.subtitle}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            {detailedFeatures && detailedFeatures.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2 md:gap-6">
                  {detailedFeatures?.map((feature, id) => (
                    <div key={id} className="bg-[#1C1C1C] p-3 md:p-6">
                      {/* Icon */}
                      <div className="mb-4 h-8 w-8">
                        <Image
                          src={feature.icon}
                          alt={`${feature.title} icon`}
                          width={32}
                          height={32}
                          className="h-[25px] w-[25px] md:h-[32px] md:w-[32px]"
                        />
                      </div>
                      {/* Title */}
                      <h3 className="font-semibold text-[12px] md:text-lg mb-2">
                        {feature.title}
                      </h3>
                      {/* Description */}
                      <p className="text-gray-400 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Text column first */}
                <div>
                  <p
                    className={`mt-2 ${
                      theme === "dark"
                        ? "text-[#FFFFFF] text-[24px]"
                        : "text-gray-600"
                    }`}
                  >
                    {cardData.para1?.text1}
                  </p>
                  <p
                    className={`${
                      theme === "dark"
                        ? "text-[#FFFFFF] text-[24px] font-bold mb-4"
                        : "text-gray-600"
                    }`}
                  >
                    {cardData.para1?.text2}
                  </p>
                  <p className="mb-4 text-[#FFFFFF] text-[20px]">
                    {cardData.para2}
                  </p>
                  <p className="font-semibold text-[24px] mb-4">
                    {cardData.highlightedText}
                  </p>
                  <p className="mb-4">{cardData.para3}</p>
                  {cardData.features &&
                    cardData.features[0] &&
                    "text" in cardData.features[0] && (
                      <p className="mb-6">{cardData.features[0].text}</p>
                    )}
                </div>
              </>
            )}
          </div>
          {/* Image column */}
          <div className="flex justify-center order-1 md:order-2">
            <Image
              src={cardData.imageSrc}
              alt={cardData.imageAlt}
              width={500}
              height={300}
              className="object-cover"
            />
          </div>
        </div>
        {isButton && (
          <div className="text-center mt-12">
            <button
              className="border border-[#eee] rounded-[4px] px-6 py-3 w-full sm:w-[192px] h-[48px] 
                text-white shadow cursor-pointer hover:bg-gray-200 hover:text-black transition"
            >
              {cardData.btnTxt ?? "READ MORE"}
            </button>
          </div>
        )}
      </section>
    );
  }

  // normal (OUR MISSION Layout)
  return (
    <section
      className={`flex flex-col gap-12 md:gap-16 ${
        theme === "dark" ? "bg-black text-white" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 ">
        {/* Title */}

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className=" md:w-[200px] w-[100px] h-px bg-gradient-to-l from-[#FDF094] to-[#B77D2B]" />
            <h1
              className={`text-3xl md:text-4xl font-bold font-corbert ${
                theme === "dark" ? "text-[#EEEEEE]" : "text-yellow-600"
              }`}
            >
              {cardData.title || "OUR MISSION"}
            </h1>
            <div className=" md:w-[200px] w-[100px] h-px bg-gradient-to-r from-[#FDF094] to-[#B77D2B]" />
          </div>

          <p
            className={`${
              theme === "dark" ? "text-gray-200" : "text-gray-600"
            }`}
          >
            {cardData.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center mb-2">
          {/* Image */}
          <div className={imageOrder}>
            <Image
              src={cardData.imageSrc}
              alt={cardData.imageAlt}
              width={550}
              height={488}
              className="rounded-lg"
            />
          </div>

          {/* Text */}
          <div className={textOrder}>
            <h3 className="font-semibold text-xl mb-4 text-black">
              {cardData.para1?.text1 || "Transparency. Convenience. Savings."}
            </h3>
            <p
              className={`${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              } mb-6`}
            >
              {cardData.para1?.text2}
            </p>

            {/* Features list */}
            {cardData.features && cardData.features.length > 0 && (
              <ul className="space-y-3 mb-6">
                {cardData.features.map((feature) => (
                  <li key={feature.id} className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    {cardData.features &&
                      cardData.features[0] &&
                      "text" in cardData.features[0] && (
                        <span className="text-[#1A1D1E]">
                          {cardData.features[0].text}
                        </span>
                      )}
                  </li>
                ))}
              </ul>
            )}

            {/* Highlight box */}
            {cardData.para3 && (
              <div className="bg-gray-100 p-4 rounded-lg shadow">
                <p className="text-gray-700">{cardData.para3}</p>
              </div>
            )}
          </div>
        </div>

        {/* Conditional button */}
        {isButton && (
          <div className="pt-8 flex justify-center">
            <button
              className={`hover:opacity-90 transition cursor-pointer ${
                theme === "dark"
                  ? "w-[150px] border-2 border-amber-200 rounded-lg px-5 py-2 mb-3 text-white"
                  : "w-full sm:w-[220px] h-[48px] rounded-md px-6 py-3 font-medium text-black bg-gradient-to-b from-[#fdf094] to-[#b77d2b]"
              }`}
            >
              {cardData.btnTxt}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ContentSection;
