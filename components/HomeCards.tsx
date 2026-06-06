"use client";
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
  return (
    <div className="w-full rounded-sm overflow-hidden shadow-sm bg-white text-black hover:shadow-xl transition">

      {/* Image */}
      <div className="relative w-full h-[230px] md:h-[304px]">
        <Image
          src={imgUrl || "/fallback.jpg"}
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      {/* Location */}
      <div className="flex py-2 pl-2 gap-2">
        {/* <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
          {location}
        </div> */}
        <div className="bg-gray-700 text-white text-xs px-2 py-1 rounded">
          RERA: {reranumber}
        </div>
      </div>

      {/* Title */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>

        <div className="grid grid-cols-2 gap-3">
          {specifications.map((spec, i) => (
            <div key={i} className="flex items-center gap-2">
              {spec.icon && (
                <Image src={spec.icon} alt="" width={20} height={20} />
              )}
              <div>
                <p className="text-xs">{spec.label}</p>
                <p className="text-sm font-semibold text-[#CEA44E]">
                  {spec.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="p-3 border-t">
        <button className="w-full bg-gradient-to-r from-[#E4C66D] to-[#B67F2C] text-white py-2 rounded">
          {btntag}
        </button>
      </div>
    </div>
  );
};

export default HomesCard;