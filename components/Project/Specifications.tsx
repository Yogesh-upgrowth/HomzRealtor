"use client";

import { useState } from "react";

type SpecItem = {
  heading: string;
  value: string;
};

type Props = {
  data: SpecItem[];
  title: string;
};

const SpecificationsTable = ({ data, title }: Props) => {
  const categories = ["Specifications"]; // single tab (same UI style)
  const [active] = useState(categories[0]);

  return (
    <div className="w-full max-w-7xl mx-auto mt-12">

      {/* Title */}
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Specifications - ${title}`}
      </h2>

      {/* Table */}
      <div className="w-full overflow-x-auto border border-white rounded-xs">
        <table className="w-full border-collapse">

          {/* Header */}
          <thead>
            <tr className="bg-yellow-600/80 text-white text-left">
              <th className="px-6 py-4 border-r border-gray-300">
                SPECIFICATION
              </th>
              <th className="px-6 py-4 border-r border-gray-300">
                DETAILS
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                className="bg-black text-white border-t border-gray-800 hover:bg-zinc-900 transition"
              >
                {/* Heading */}
                <td className="px-6 py-4 border-r border-gray-800 font-medium">
                  {item.heading}
                </td>

                {/* Value */}
                <td className="px-6 py-4 border-r border-gray-800">
                  {item.value}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default SpecificationsTable;