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

  // Defensive clamp: if a caller ever swaps `images` for a shorter array
  // without remounting this component (no `key` change), `current` can
  // point past the new array's end — images[current] is then undefined,
  // which next/image renders as a broken image. GalleryTabs.tsx now keys
  // its Carousel per tab to avoid this in the one place it happened live,
  // but this keeps any other caller safe too.
  useEffect(() => {
    if (current >= images.length && images.length > 0) {
      setCurrent(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  // MI-07 (2026-09-18): this used to auto-advance every 4s with no pause
  // control, moving photos without any user action — a real WCAG 2.2.2
  // issue and a confusing "why did the photo change" experience. Removed
  // rather than given a Play/Pause control: the handoff's own default is
  // manual browsing, and adding new UI for a feature nobody asked to keep
  // would be scope creep. Navigation is now entirely user-driven.

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images.length) return null;

  const currentFailed = failed.has(current);
  // MI-07: a single-image gallery has nothing to navigate between — showing
  // arrows/dots/a "1 / 1" counter for it is redundant chrome, not real
  // navigation.
  const hasMultiple = images.length > 1;

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
                ? `${alt}, photo ${current + 1} of ${images.length}`
                : `Property photo ${current + 1} of ${images.length}`
            }
            fill
            unoptimized
            priority={current === 0}
            onError={() => setFailed((prev) => new Set(prev).add(current))}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {hasMultiple && (
        <>
          {/* MI-07: arrows used to be opacity-0 until :hover, so a
              keyboard-focused (or touch-device) arrow was invisible even
              though it was the active element. Visible at all times now;
              hover/focus only add emphasis. */}
          <button
            onClick={prevSlide}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black focus-visible:bg-black text-white p-3 rounded-full transition"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next image"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black focus-visible:bg-black text-white p-3 rounded-full transition"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>

          {/* Readable N / M counter — announced politely on real (user-driven)
              changes only, since automatic rotation no longer exists. */}
          <div
            aria-live="polite"
            className="absolute right-4 top-4 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white"
          >
            {current + 1} / {images.length}
          </div>

          {/* Dots: visual size stays small, but the hit area is padded out
              to ~24px (WCAG 2.5.8 AA minimum) — MI-07 measured the old
              unpadded buttons at 8x8px. */}
          <div className="flex justify-center mt-4 gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === current}
                className="p-2"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    index === current ? "w-6 bg-black" : "w-2 bg-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
