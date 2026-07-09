"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";

export type DetailItem = {
  icon: StaticImageData | string;
  label: string;
  value: string;
};

export type PriceRow = {
  id: number | string;
  bhkType: string;
  size: string;
  price: string;
};

export interface ProjectSectionProps {
  title: string;
  variant: "details" | "pricing";
  detailsItems?: DetailItem[];
  description?: string;
  subtitle?: string;
  priceList?: PriceRow[];
  city?: string;
  slug?: string;
}

const ProjectSection: React.FC<ProjectSectionProps> = ({
  title,
  variant,
  detailsItems,
  description,
  subtitle,
  priceList,
  city = "",
  slug = "",
}) => {
  const isDetailsVariant = variant === "details";

  const sectionClasses = isDetailsVariant ? "bg-black text-white" : "bg-white";

  const titleClasses = isDetailsVariant
    ? "md:text-white"
    : "md:text-black";

  const lineClasses = isDetailsVariant ? "bg-yellow-600/50" : "bg-gray-300";

  return (
    <section className={`py-16 px-4 sm:px-6 ${sectionClasses}`}>

      {/* ===== Title ===== */}
      <div className="flex items-center justify-center gap-4 w-full mb-8">
        <div className={`hidden md:block md:w-[200px] h-px ${lineClasses}`} />
        
        <h2 className={`text-lg md:text-2xl font-bold tracking-widest text-center ${titleClasses}`}>
          {title}
        </h2>

        <div className={`hidden md:block md:w-[200px] h-px ${lineClasses}`} />
      </div>

      {/* ===== DETAILS ===== */}
      {variant === "details" && (
        <div className="max-w-7xl mx-auto">

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {detailsItems?.map((item, index) => (
              <div
                key={index}
                className="border border-yellow-600/50 rounded-sm flex items-center p-3 gap-2 bg-[#393939] md:bg-black"
              >
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={40}
                  height={40}
                />

                <div>
                  <p className="text-xs text-gray-300">{item.label}</p>
                  <p className="text-sm font-semibold text-yellow-500">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {description && (
            <p className="text-gray-300 text-center text-sm md:text-base">
              {description}
            </p>
          )}
        </div>
      )}

      {/* ===== PRICING ===== */}
      {variant === "pricing" && (
        <div className="max-w-7xl mx-auto">

          {subtitle && (
            <p className="text-center text-gray-700 mb-6">{subtitle}</p>
          )}

          <div className="overflow-x-auto border border-gray-300">
            <table className="w-full border-collapse">

              {/* Header */}
              <thead className="bg-yellow-600 text-white">
                <tr>
                  <th className="p-3 text-center border border-white/30">
                    Unit Type
                  </th>
                  <th className="p-3 text-center border border-white/30">
                    Price
                  </th>
                  <th className="p-3 text-center">
                    Enquire
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="bg-black text-white">
                {priceList?.map((row, index) => {
                  const unit = `${row.bhkType} ${row.size}`;
                  const price = row.price;

                  return (
                    <tr key={row.id ?? index} className="border-t border-gray-600">

                      <td className="p-3 text-center border border-gray-700 text-xs md:text-base">
                        {unit} sqft
                      </td>

                      <td className="p-3 text-center border border-gray-700 text-xs md:text-base">
                        {price}
                      </td>

                      <td className="p-3 text-center">
                        <Link
                          href={`/project-listing/${city}/${slug}/enquire`}
                          className="inline-block bg-white text-[#754E1A] text-xs md:text-sm px-3 py-1.5 rounded-sm hover:bg-gray-200 transition"
                        >
                          ENQUIRE NOW
                        </Link>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectSection;