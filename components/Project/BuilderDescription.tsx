"use client";

type BuilderDescriptionProps = {
  title: string;
  description: string;
  maxLines?: number;
};

const BuilderDescription = ({
  title,
  description,
  maxLines = 7,
}: BuilderDescriptionProps) => {
  return (
    <div className="w-full bg-black border border-gray-300 rounded-xl p-5 sm:p-6 h-[94%] flex flex-col">
      
      {/* Title */}
      <h2 className="bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent font-bold text-2xl mb-3">
        {title}
      </h2>

      {/* Divider */}
      <div className="border-b border-gray-200 mb-4" />

      {/* Description */}
      <div className="relative h-full overflow-hidden">
        
        {/* Text */}
        <div className="text-white text-sm sm:text-[15px] leading-6 sm:leading-7">
            {description}
        </div>

        </div>
    </div>
  );
};

export default BuilderDescription;