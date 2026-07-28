"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageOff, ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageCarousel({
  images = [],
  alt,
}: {
  images: string[];
  // Descriptive base text (e.g. "M3M Route 65 — Exterior") for image alt
  // attributes — falls back to a generic label only if the caller omits it.
  alt?: string;
}) {
  const [current, setCurrent] = useState(0);

  // Tracks which slide indices failed to load, keyed by index — so one broken
  // image doesn't permanently hide every other (working) slide in the set.
  const [failed, setFailed] = useState<Set<number>>(new Set());

  // ✅ autoplay
  useEffect(() => {
    if (!images.length) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [images]);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images.length) return null;

  const currentFailed = failed.has(current);

  return (
    <div className="relative w-full max-w-4xl mx-auto group">

      {/* ✅ Image Container */}
      <div className="relative h-[300px] md:h-[450px] overflow-hidden rounded-2xl shadow-lg bg-gray-100">

        {currentFailed ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
            <ImageOff size={32} />
            <span className="text-sm">Image unavailable</span>
          </div>
        ) : (
          <Image
            key={current}
            src={images[current]}
            alt={
              alt
                ? `${alt} — photo ${current + 1} of ${images.length}`
                : `Property photo ${current + 1} of ${images.length}`
            }
            fill
            priority={current === 0}
            onError={() => setFailed((prev) => new Set(prev).add(current))}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* ✅ Left Arrow */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition"
      >
        <ChevronLeft size={20} />
      </button>

      {/* ✅ Right Arrow */}
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition"
      >
        <ChevronRight size={20} />
      </button>

      {/* ✅ Dots */}
      <div className="flex justify-center mt-4 gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === current
                ? "w-6 bg-black"
                : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
