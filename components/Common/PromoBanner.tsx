import React from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
interface PromoBannerProps {
  heading: string;
  text: string;
  buttonText: string;
  buttonLink?: string;
  imageSrc: string | StaticImageData;
}

const PromoBanner: React.FC<PromoBannerProps> = ({
  heading,
  text,
  buttonText,
  buttonLink = "#",
  imageSrc,
}) => {
  return (
    <section className="relative w-full w-full  min-h-[220px] md:aspect-[16/4.5] mt-14 rounded-xs md:rounded-xl overflow-hidden">
      
      {/* 1. Background Image (hidden on mobile) */}
      <Image
        src={imageSrc}
        alt="Couple reviewing properties with an agent"
        fill
        priority
        className="hidden md:block object-cover z-0 scale-x-[-1]"
      />

      {/* 2. Gradient Overlay */}
      <div
        className="
          absolute inset-0 z-10
          bg-[linear-gradient(rgba(227,182,93,1),rgba(206,164,78,1))]
          md:bg-gradient-to-r md:from-[#cd9016] md:via-[#CEA44E] md:via-50% md:to-transparent
        "
      />

      {/* 3. Content */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center text-center px-6 py-8 md:items-start md:text-left md:px-10 lg:pl-16">
        <div className="w-full max-w-md space-y-3 text-white md:max-w-none md:w-[60%]">
          
          <h2
            className="
              font-corbert text-[20px] uppercase tracking-widest leading-snug
              md:font-sans md:normal-case md:tracking-normal md:text-4xl
            "
          >
            {heading}
          </h2>

          <p className="text-base md:text-[18px]">
            {text}
          </p>

          <Link
            href={buttonLink}
            className="
              inline-block bg-white text-sm text-[#754E1A]
              w-full md:w-auto px-10 py-3 rounded-md shadow-lg
              hover:bg-gray-100 transition-colors uppercase tracking-wide
              md:normal-case md:tracking-normal md:text-[18px]
            "
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;