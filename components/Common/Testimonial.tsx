"use client";
import useEmblaCarousel from "embla-carousel-react";
import Image, { StaticImageData } from "next/image";
import { useState, useEffect, useCallback } from "react";
import React from "react";

export type TestimonialsType = {
  id: number;
  name: string;
  role: string;
  image: StaticImageData | string;
  text: string;
  rating: number;
};

interface TestimonialsProps {
  title: string;
  subtitle?: string;
  testimonialsData: TestimonialsType[];
}

export default function Testimonials({
  title,
  subtitle,
  testimonialsData,
}: TestimonialsProps): React.ReactElement {
  const [expandedId, setExpandedId] = useState<null | number>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel();

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setPrevBtnDisabled(!emblaApi.canScrollPrev());
      setNextBtnDisabled(!emblaApi.canScrollNext());
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      {/* Title */}
      <div className="flex items-center justify-center gap-4 w-full">
        <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>

        <h2 className="font-display font-medium text-2xl sm:text-3xl md:text-[40px] leading-[120%] tracking-[0.02em] uppercase text-center bg-gradient-to-b from-[#F2D79B] to-[#C99A4B] bg-clip-text text-transparent">
          {title}
        </h2>

        <div className="flex-1 h-px bg-gradient-to-l from-white/20 to-transparent"></div>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-gray-400 mt-4 mb-8 text-center text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}

      {/* Carousel */}
      <div className="relative">
        {/* Prev Button */}
        <button
          type="button"
          onClick={scrollPrev}
          disabled={prevBtnDisabled}
          className="absolute z-30 top-1/2 -translate-y-1/2 left-2 sm:-left-6 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-[#1a1a1d] border border-white/10 text-[#D9B268] hover:border-[#D9B268] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 sm:w-6 sm:h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        {/* Slides */}
        <div className="overflow-hidden px-2 sm:px-5" ref={emblaRef}>
          <div className="flex gap-3 sm:gap-4">
            {testimonialsData.map((item) => {
              const isExpanded = expandedId === item.id;

              return (
                <article
                  key={item.id}
                  className="flex-shrink-0 basis-[90%] sm:basis-1/2 lg:basis-1/3 bg-[#141416] border border-white/[0.08] text-white rounded-[18px] px-4 sm:px-6 py-6 sm:py-8 shadow-md flex flex-col justify-between"
                >
                  {/* Content */}
                  <div className="bg-[#1a1a1d] rounded-md px-4 py-5 mb-5">
                    {/* Rating */}
                    <div className="flex text-[#D9B268] mb-3">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>

                    {/* Text */}
                    <p
                      className={`text-xs sm:text-sm md:text-base text-gray-300 leading-relaxed ${
                        isExpanded ? "line-clamp-none" : "line-clamp-3"
                      }`}
                    >
                      {item.text}
                    </p>

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : item.id)
                      }
                      className="text-[#D9B268] underline underline-offset-2 mt-2 cursor-pointer"
                    >
                      {isExpanded ? "Read less" : "Read more"}
                    </button>
                  </div>

                  {/* User */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0">
                      {typeof item.image === "string" ? (
                        // Generated data-URI avatars (see lib/initialsAvatar.ts)
                        // gain nothing from next/image's optimizer and aren't
                        // one of its supported remote/static sources.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">
                        {item.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {item.role}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={scrollNext}
          disabled={nextBtnDisabled}
          className="absolute z-30 top-1/2 -translate-y-1/2 right-2 sm:-right-6 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-[#1a1a1d] border border-white/10 text-[#D9B268] hover:border-[#D9B268] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 sm:w-6 sm:h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}