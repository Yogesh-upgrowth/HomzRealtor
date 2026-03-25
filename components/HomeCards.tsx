"use client";
import Image from "next/image";

type Specification = {
  icon?: string;
  label: string;
  value: string;
};

interface HomeCardProps {
  imgUrl: string;
  location: string;
  reranumber: string;
  title: string;
  specifications: Specification[];
  btntag: string;
}

const HomesCard: React.FC<HomeCardProps> = ({
  imgUrl,
  location,
  reranumber,
  title,
  specifications,
  btntag,
}) => {
  return (
    <div className="w-full rounded-lg overflow-hidden shadow-sm bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]">

      {/* ✅ Image */}
      <div className="relative w-full h-[230px] md:h-[304px]">
        <Image
          src={imgUrl || "/fallback.jpg"}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={false}
        />
      </div>

      {/* ✅ Location & RERA */}
      <div className="flex py-2 pl-1 space-x-2">
        <div className="flex items-center bg-gray-800 text-white text-sm rounded-sm px-2 py-1 mx-1.5">
          <Image
            src="/location.svg"
            alt="location"
            width={16}
            height={16}
          />
          <span className="ml-1.5">{location || "N/A"}</span>
        </div>

        <div className="flex items-center bg-gray-700 text-white text-xs font-semibold rounded-md px-3 py-1">
          Rera No.
          <span className="ml-1.5">{reranumber || "N/A"}</span>
        </div>
      </div>

      {/* ✅ Title & Specs */}
      <div className="p-4">
        <h2 className="text-xl font-semibold text-[#212121] mb-4">
          {title}
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {specifications.map((spec, index) => (
            <div key={index} className="flex items-center space-x-2">
              
              {/* Icon */}
              {spec.icon && (
                <Image
                  src={spec.icon}
                  alt={spec.label}
                  width={28}
                  height={28}
                  className="object-contain"
                />
              )}

              <div>
                <p className="text-[12px] text-[#212121]">
                  {spec.label}
                </p>
                <p className="text-[13px] font-semibold text-[#CEA44E]">
                  {spec.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Bottom */}
      <hr className="bg-gradient-to-r from-[#E4C66D] via-[#B67F2C] to-[#E4C66D] h-1" />
      <div className="flex justify-between items-center p-3">
        
        {/* CTA */}
        <button className="text-[13px] cursor-pointer md:text-[16px] bg-gradient-to-r from-[#E4C66D] via-[#B67F2C] to-[#E4C66D] text-white font-bold py-1 px-3 rounded-sm">
          {btntag}
        </button>

        {/* Icons */}
        <div className="flex space-x-2">
          <button className="p-2 border-2 border-[#CEA44E] rounded-lg">
            <Image
              src="/icons/icon1.svg"
              alt="contact"
              width={20}
              height={20}
            />
          </button>
          <button className="p-2 border-2 border-[#CEA44E] rounded-lg">
            <Image
              src="/icons/icon.svg"
              alt="call"
              width={20}
              height={20}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomesCard;