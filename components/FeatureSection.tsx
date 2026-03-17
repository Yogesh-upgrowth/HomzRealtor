import React from "react";
import Image from "next/image";
import { FeatureSectionProps } from "@/models/types";

const FeatureSection: React.FC<FeatureSectionProps> = ({
  title,
  subtitle,
  variant,
  galleryImages,
  mapData,
}) => {
  const isGallery = variant === "gallery";

  const sectionClasses = isGallery
    ? "bg-white text-gray-800"
    : "bg-black text-white";
  // const titleClasses = isGallery ? "text-gray-900" : "text-white";
  const titleClasses = isGallery
    ? `
    bg-gradient-to-b from-[#FDF094] to-[#B77D2B]
    text-transparent bg-clip-text inline-block
    md:bg-none md:text-gray-900 md:text-opacity-100
  `
    : `
    bg-gradient-to-b from-[#FDF094] to-[#B77D2B]
    text-transparent bg-clip-text inline-block
    md:bg-none md:text-white md:text-opacity-100
  `;
  const subtitleClasses = isGallery ? "text-gray-600" : "text-gray-300";
  const lineClasses = isGallery ? "bg-gray-300" : "bg-gray-600";

  return (
    <section className={`py-16 px-4 sm:px-6 ${sectionClasses}`}>
      <div className="max-w-7xl mx-auto">
        {/* Title Header */}
        <div className="flex items-center justify-center gap-4 w-full mb-4">
          <div
            className={`hidden md:block md:w-[200px] w-[100px] h-px bg-gradient-to-r from-black/50 to-transparent ${lineClasses}`}
          />
          {/* <div className={`flex-1 h-px ${lineClasses}`}></div> */}
          <h2
            className={`text-lg md:text-2xl font-corbert tracking-widest text-center md:whitespace-nowrap ${titleClasses}`}
          >
            {title}
          </h2>
          {/* <div className={`flex-1 h-px ${lineClasses}`}></div> */}
          <div
            className={`hidden md:block md:w-[200px] w-[100px] h-px bg-gradient-to-l from-black/50 to-transparent ${lineClasses}`}
          />
        </div>
        <p className={`text-center max-w-3xl mx-auto mb-12 ${subtitleClasses}`}>
          {subtitle}
        </p>

        {/* --- CONDITIONAL CONTENT --- */}
        <div className="mt-8">
          {/* Gallery Variant */}
          {isGallery && galleryImages && (
            <>
              {/* Mobile (horizontal scroll) */}
              <div className="flex sm:hidden overflow-x-auto gap-1 px-2">
                {galleryImages.map((image) => (
                  <div
                    key={image.id}
                    className="flex-shrink-0 w-64 overflow-hidden rounded-md"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={600}
                      height={400}
                      className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                ))}
              </div>

              {/* desktop gallary */}
              <div className="hidden sm:block sm:columns-3 lg:columns-5 gap-4 space-y-4">
                {galleryImages.map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden break-inside-avoid"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={600}
                      height={400}
                      className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Map Variant */}
          {variant === "map" && mapData && (
            <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-lg">
              <Image
                src={mapData.src}
                alt={mapData.alt}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
