import Link from "next/link";
import { instrumentSerif, manrope } from "@/lib/fonts";

interface ComingSoonProps {
  title: string;
  description?: string;
}

// Matches the dark theme every other nav destination (Buy/Rent/PG/Commercial
// Property, Projects) already shares — this used to render on the default
// white body background, a jarring break when navigating here from any of
// those pages.
export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section
      className={`${instrumentSerif.variable} ${manrope.variable} font-ui min-h-screen bg-[#0B0B0C] text-white flex items-center justify-center px-4 pt-32 pb-16`}
    >
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <span className="text-sm tracking-[0.3em] uppercase text-[#D9B268]">
          Coming Soon
        </span>

        <h1 className="mt-4 text-3xl md:text-5xl font-bold bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent uppercase tracking-wide">
          {title}
        </h1>

        <p className="mt-6 text-gray-400 text-lg">
          {description ??
            "We're working hard to bring this experience to you. This section will be available soon — stay tuned!"}
        </p>

        <Link
          href="/"
          className="inline-block mt-8 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-6 py-3 font-semibold text-[#1c1608] hover:brightness-105 transition"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
