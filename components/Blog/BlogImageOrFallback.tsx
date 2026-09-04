import Image from "next/image";
import { isPlaceholderImage } from "@/lib/seo/blogJsonLd";

// Every hero/thumbnail image across the v2.7 posts is still a placeholder
// (see each post file's header comment) — rather than show 25 broken <img>
// icons across the blog, this renders a themed gradient block with the
// article's category label until real photography replaces the URLs.
const BlogImageOrFallback = ({
  src,
  alt,
  categoryLabel,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  categoryLabel?: string;
  priority?: boolean;
  sizes: string;
}) => {
  if (isPlaceholderImage(src)) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F6D7B9] to-[#B77D2B] text-center"
        role="img"
        aria-label={alt}
      >
        {categoryLabel && (
          <span className="px-4 text-sm font-bold uppercase tracking-wide text-white/90">
            {categoryLabel}
          </span>
        )}
      </div>
    );
  }
  return (
    <Image src={src} alt={alt} fill unoptimized priority={priority} sizes={sizes} className="object-cover" />
  );
};

export default BlogImageOrFallback;
