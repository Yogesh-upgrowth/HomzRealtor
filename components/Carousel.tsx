"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageCarousel({ images = [] }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  // ✅ fallback for broken images
  const [imgError, setImgError] = useState(false);

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

  return (
    <div className="relative w-full max-w-4xl mx-auto group">

      {/* ✅ Image Container */}
      <div className="relative h-[300px] md:h-[450px] overflow-hidden rounded-2xl shadow-lg">

        <Image
          src={!imgError ? images[current] : "/fallback.jpg"}
          alt={`slide-${current}`}
          fill
          priority={current === 0}
          onError={() => setImgError(true)}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 1200px"
        />

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