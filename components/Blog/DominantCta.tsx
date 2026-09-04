import Link from "next/link";
import type { BlogPostV27 } from "@/lib/content/blogPostSchema";

// Mirrors components/Common/Appointment.tsx's visual language (the site's
// existing dominant-CTA pattern — same gradient, same button styling) but
// navigates to the article's real, data-driven url instead of opening the
// generic enquiry modal, since bottom_cta.url is always a specific page
// (e.g. a corridor's live listings), not a generic contact request.
const DominantCta = ({ cta }: { cta: BlogPostV27["bottomCta"] }) => {
  return (
    <section
      className="relative -mx-4 overflow-hidden px-4 py-14 text-center text-white md:mx-0 md:rounded-2xl md:py-16"
      style={{ background: "linear-gradient(135deg, #1a1310 0%, #3a2a12 55%, #B77D2B 100%)" }}
    >
      <div className="relative mx-auto max-w-2xl">
        <span className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#F6D7B9]">
          {cta.kicker ?? "Your move"}
        </span>
        <h2 className="mb-3 text-2xl font-bold tracking-wide md:text-3xl">{cta.headline}</h2>
        {cta.body && <p className="mb-6 text-[15px] opacity-90 md:text-base">{cta.body}</p>}
        <Link
          href={cta.url}
          className="inline-block rounded-md bg-white px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-200"
        >
          {cta.buttonText.toUpperCase()}
        </Link>
      </div>
    </section>
  );
};

export default DominantCta;
