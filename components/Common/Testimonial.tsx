"use client";
import useEmblaCarousel from "embla-carousel-react";
import Image, { StaticImageData } from "next/image";
import { useState, useEffect, useCallback } from "react";
import dummy from "../../../../public/plots.svg";
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

    // function for when the carousel settles on a new slide
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6  ">
      <div className="flex items-center justify-center gap-4 w-full">
        <div className="flex-1 h-px bg-gradient-to-r from-black/50 to-transparent"></div>

        <h2
          id="testimonials-title"
          className="font-second font-medium text-2xl sm:text-3xl md:text-[40px] leading-[120%] tracking-[0.02em] uppercase text-center 
               bg-gradient-to-b from-[#fdf094] to-[#b77d2b] bg-clip-text text-transparent"
        >
          {title}
        </h2>

        <div className="flex-1 h-px bg-gradient-to-l from-black/50 to-transparent"></div>
      </div>
      {subtitle && (
        <p className="text-gray-600 mt-4 mb-10 text-center text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"> */}
      <div className="relative">
        {/* Previous Button */}
        <button
          type="button"
          className="absolute z-30 top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-[#1f1f1f] text-[#cea44e] hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          onClick={scrollPrev}
          disabled={prevBtnDisabled}
          aria-label="Previous testimonial"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        {/* review div */}
        <div className="overflow-hidden px-5" ref={emblaRef}>
          <div className="flex gap-4">
            {testimonialsData.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <article
                  key={item.id}
                  // className="bg-black text-white rounded-lg px-6 py-8 shadow-md flex flex-col justify-between"
                  className="flex-shrink-0 flex-grow-0 basis-full sm:basis-1/2 lg:basis-1/3 bg-black text-white rounded-lg px-6 py-8 shadow-md flex flex-col justify-between"
                >
                  <div className="bg-[#1f1f1f] rounded-md px-4 py-6 mb-6">
                    <div
                      className="flex text-[#cea44e] mb-4"
                      aria-label={`Rating: ${item.rating} out of 5`}
                    >
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>

                    <p
                      className={`text-sm md:text-base text-gray-200 leading-relaxed ${
                        isExpanded ? "line-clamp-none" : "line-clamp-3"
                      }`}
                    >
                      {item.text}
                    </p>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-[#cea44e] underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[#cea44e] cursor-pointer"
                    >
                      {isExpanded ? "Read less" : "Read more"}
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={`Photo of ${item.name}`}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm md:text-base">
                        {item.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-400">
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
          className="absolute z-30 top-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-[#1f1f1f] text-[#cea44e] hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          onClick={scrollNext}
          disabled={nextBtnDisabled}
          aria-label="Next testimonial"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
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
