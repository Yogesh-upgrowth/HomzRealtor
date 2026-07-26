"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  sizes?: string;
};

// The backend's project images all come from a single slow/unreliable
// third-party CDN (static.squareyards.com) — Next's server-side image
// optimizer occasionally times out reaching it (seen in production more
// than local dev, where fetches go straight from the developer's own
// machine), so every image needs a graceful fallback instead of a broken-
// image icon. `unoptimized` skips the optimizer proxy for this host — the
// source URLs already carry their own resize params (e.g. `?aio=w-0;h-550;`),
// so nothing is lost by fetching them directly.
const SafeProjectImage = ({ src, alt, sizes }: Props) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-[#1a1a1d] text-gray-600">
        <ImageOff size={20} />
        <span className="text-[11px]">Image unavailable</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      onError={() => setFailed(true)}
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      sizes={sizes}
    />
  );
};

export default SafeProjectImage;
