import React from "react";
import Image, { StaticImageData } from "next/image";

export type DetailItem = {
  icon: StaticImageData | string;
  label: string;
  value: string;
};

// For the 'pricing' variant table rows
export type PriceRow = {
  id: number | string;
  configuration: string;
  size: string;
};

export interface ProjectSectionProps {
  title: string;
  variant: "details" | "pricing";
  detailsItems?: DetailItem[];
  description?: string[];
  subtitle?: string;
  priceList?: PriceRow[];
}

const ProjectSection: React.FC<ProjectSectionProps> = ({
  title,
  variant,
  detailsItems,
  description,
  subtitle,
  priceList,
}) => {
  const isDetailsVariant = variant === "details";

  // Section-level styles
  const sectionClasses = isDetailsVariant ? "bg-black text-white" : "bg-white";

  // Title-specific styles
  const titleClasses = isDetailsVariant
    ? `
    bg-gradient-to-b from-[#FDF094] to-[#B77D2B]
    text-transparent bg-clip-text inline-block
    md:bg-none md:text-white md:text-opacity-100
  `
    : `
    bg-gradient-to-b from-[#FDF094] to-[#B77D2B]
    text-transparent bg-clip-text inline-block
    md:bg-none md:text-black md:text-opacity-100
  `;

  // Decorative line styles
  const lineClasses = isDetailsVariant ? "bg-yellow-600/50" : "bg-gray-300";

  return (
    <section className={`py-16 px-4 sm:px-6 ${sectionClasses}`}>
      {/* --- Title Header */}
      <div className="flex items-center justify-center gap-4 w-full mb-8">
        {/* <div className={`flex-1 h-px ${lineClasses}`}></div> */}
        <div
          className={`hidden md:block md:w-[200px] h-px bg-gradient-to-r from-black/50 to-transparent ${lineClasses}`}
        />
        <h2
          className={`
      
      text-lg md:text-2xl font-corbert tracking-widest text-center md:whitespace-nowrap
      ${titleClasses}
    `}
        >
          {title}
        </h2>
        <div
          className={`hidden md:block md:w-[200px] h-px bg-gradient-to-l from-black/50 to-transparent ${lineClasses}`}
        />
      </div>

      {/* CONDITIONAL RENDERING: 'details' variant */}
      {variant === "details" && (
        <div className="max-w-7xl mx-auto">
          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 mb-8">
            {detailsItems?.map((item, index) => (
              <div
                key={index}
                className="border border-yellow-600/50 rounded-sm flex flex-center p-2 gap-1 md:gap-3 flex-shrink-0 text-center bg-[#393939] md:bg-black"
              >
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={40}
                  height={50}
                  className="w-[35px] h-[35px] md:w-[40px] md:h-[50px]"
                />
                <div className="flex flex-col justify-center">
                  <p className="text-[12px] md:text-sm text-[#EEEEEE] mt-2 ">
                    {item.label}
                  </p>
                  <p className="text-[11px] md:text-sm  font-semibold mt-1 text-[#CEA44E]">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Description Paragraphs */}
          <div className="space-y-4 text-gray-300 text-center text-[12px] md:text-[18px]">
            {description?.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {/* CONDITIONAL RENDERING: 'pricing' variant */}
      {variant === "pricing" && (
        <div className="max-w-7xl mx-auto">
          {/* Subtitle */}
          {subtitle && (
            <p className="text-center text-[#212121] mb-8">{subtitle}</p>
          )}

          {/* Pricing Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-yellow-600/80 text-white tex-[12px] md:text-[20px]">
                <tr>
                  <th className="p-3 text-center border-1 border-gray-100 ">
                    Configuration
                  </th>
                  <th className="p-3 text-center border-1 border-gray-100">
                    Size
                  </th>
                  <th className="p-3 text-center">Price</th>
                </tr>
              </thead>
              <tbody className="bg-black">
                {priceList?.map((row) => (
                  <tr key={row.id} className="border-2 border-gray-100 px-1">
                    <td className="md:p-3 text-center border-1 border-gray-100 text-[10px] md:text-[16px]">
                      {row.configuration}
                    </td>
                    <td className="md:p-3 text-center border-1 border-gray-100 text-[10px] md:text-[16px]">
                      {row.size}
                    </td>
                    <td className="p-2 md:p-3 text-center">
                      <button className="bg-white text-[#754E1A] text-[8.5px] md:text-[16px] px-1 md:px-4 py-1 md:py-2 rounded-sm hover:bg-gray-200 cursor-pointer">
                        ENQUIRE NOW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectSection;
