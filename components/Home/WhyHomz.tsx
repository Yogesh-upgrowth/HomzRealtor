import Image from "next/image";
import { ShieldCheck, Users, IndianRupee, FileCheck2, Heart } from "lucide-react";
import aboutHomz from "@/assets/images/aboutHomz.jpg";
import discoverImage2 from "@/assets/images/discoverImage2.jpg";
import discoverImage3 from "@/assets/images/discoverImage3.jpg";

const FEATURES = [
  { icon: ShieldCheck, title: "Verified Listings", text: "Every listing verified by our compliance team." },
  { icon: Users, title: "Expert Guidance", text: "Get advice from local experts and consultants." },
  { icon: IndianRupee, title: "Best Deals", text: "Access exclusive deals and early-bird offers." },
  { icon: FileCheck2, title: "Transparent Process", text: "Clear, honest and hassle-free transactions." },
];

const WhyHomz = () => {
  return (
    <section id="why-homz" className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
            Why choose us
          </p>
          <h2 className="mb-7 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
            Why Choose Homz Realtor?
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3.5">
                <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-[#D9B268]/25 bg-[#D9B268]/10 text-[#D9B268]">
                  <f.icon size={21} />
                </span>
                <div>
                  <h3 className="mb-1 text-[15px] font-bold text-white">{f.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-gray-400">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="grid h-[380px] grid-cols-[1.3fr_1fr] grid-rows-2 gap-3.5 md:h-[440px]">
            <div className="relative row-span-2 overflow-hidden rounded-[18px]">
              <Image
                src={aboutHomz}
                alt="Luxury living room interior"
                fill
                sizes="(min-width: 1024px) 28vw, 55vw"
                className="object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-[18px]">
              <Image
                src={discoverImage2}
                alt="Modern kitchen interior"
                fill
                sizes="(min-width: 1024px) 22vw, 40vw"
                className="object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-[18px]">
              <Image
                src={discoverImage3}
                alt="Master bedroom interior"
                fill
                sizes="(min-width: 1024px) 22vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-[18px] border border-white/10 bg-[#131315] px-4.5 py-3.5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] text-[#1c1608]">
              <Heart size={15} />
            </span>
            <div>
              <p className="text-[13px] font-bold text-white">Your Trusted Partner</p>
              <p className="text-[11.5px] text-gray-500">in Gurgaon Real Estate</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyHomz;
