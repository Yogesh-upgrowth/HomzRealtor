"use client";

import { useState } from "react";

type LandmarkItem = {
  name: string;
  distance: string;
};

type LandmarksData = {
  [key: string]: LandmarkItem[];
};

type Props = {
  data: LandmarksData;
  title: string;
};

const LandmarksTable = ({ data,title }: Props) => {
  const categories = Object.keys(data);
  const [active, setActive] = useState(categories[0]);

  return (
    <div className="w-full max-w-7xl mx-auto mt-12">
    <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Nearby Landmarks - ${title}`}
      </h2> 
      {/* ===== Horizontal Tabs ===== */}
      <div className="flex overflow-x-auto gap-3 pb-3 mb-6 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActive(category)}
            className={`whitespace-nowrap px-5 py-2 rounded-md text-sm font-semibold transition ${
              active === category
                ? "bg-gradient-to-r from-[#F2D79B] to-[#C99A4B] text-[#1c1608]"
                : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* ===== Table ===== */}
      <div className="w-full overflow-x-auto border border-white rounded-xs">
        <table className="w-full border-collapse">

          {/* Header */}
          <thead>
            <tr className="bg-gradient-to-r from-[#F2D79B]/90 to-[#C99A4B]/90 text-[#1c1608] text-left">
              <th className="px-6 py-4 border-r border-gray-300">
                {active.toUpperCase()} NAME
              </th>
              <th className="px-6 py-4 border-r border-gray-300">
                DISTANCE
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data[active].map((item, index) => (
              <tr
                key={index}
                className="bg-black text-white border-t border-gray-800 hover:bg-zinc-900 transition"
              >
                {/* Name */}
                <td className="px-6 py-4 border-r border-gray-800">
                  {item.name}
                </td>

                {/* Distance */}
                <td className="px-6 py-4 border-r border-gray-800">
                  {item.distance}
                </td>

                {/* Button */}
                {/* <td className="px-6 py-4 text-center">
                  <button className="bg-gray-200 text-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-white transition">
                    VIEW
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default LandmarksTable;