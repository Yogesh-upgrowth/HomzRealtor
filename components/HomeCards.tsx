"use client";
import { useState } from "react";
import Image from "next/image";

type Specification = {
  icon?: any;
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
  const [imgFailed, setImgFailed] = useState(false);
  const src = imgFailed ? "/dummy.svg" : imgUrl || "/dummy.svg";

  return (
    <div className="w-full rounded-[18px] overflow-hidden border border-white/[0.08] bg-[#141416] text-white hover:border-[#D9B268]/35 hover:-translate-y-1 transition">
      {/* Image */}
      <div className="relative w-full h-[230px] md:h-[304px]">
        <Image
          src={src}
          alt={title}
          fill
          unoptimized={src !== "/dummy.svg"}
          onError={() => setImgFailed(true)}
          className="object-cover"
        />
      </div>

      {/* Location */}
      <div className="flex py-2 pl-2 gap-2">
        <div className="bg-white/[0.06] border border-white/10 text-gray-300 text-xs px-2 py-1 rounded-full">
          RERA: {reranumber}
        </div>
      </div>

      {/* Title */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2 text-white">{title}</h2>

        <div className="grid grid-cols-2 gap-3">
          {specifications.map((spec, i) => (
            <div key={i} className="flex items-center gap-2">
              {spec.icon && (
                <Image src={spec.icon} alt="" width={20} height={20} className="opacity-80" />
              )}
              <div>
                <p className="text-xs text-gray-500">{spec.label}</p>
                <p className="text-sm font-semibold text-[#D9B268]">
                  {spec.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="p-3 border-t border-white/[0.08]">
        <button className="w-full bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] text-[#1c1608] font-semibold py-2 rounded-xl hover:brightness-105 transition">
          {btntag}
        </button>
      </div>
    </div>
  );
};

export default HomesCard;
