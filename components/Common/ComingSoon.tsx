import Link from "next/link";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 mt-25">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <span className="text-sm font-sans tracking-[0.3em] uppercase text-[#CEA44E]">
          Coming Soon
        </span>

        <h1 className="mt-4 text-3xl md:text-5xl font-corbert font-bold bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent uppercase tracking-wide">
          {title}
        </h1>

        <p className="mt-6 text-gray-600 text-lg font-sans">
          {description ??
            "We're working hard to bring this experience to you. This section will be available soon — stay tuned!"}
        </p>

        <Link
          href="/"
          className="inline-block mt-8 px-6 py-3 bg-[#CEA44E] hover:bg-yellow-600 text-black rounded transition"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
