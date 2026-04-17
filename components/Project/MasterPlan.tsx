"use client";

import { useState, useRef, useEffect } from "react";

type ImageDescriptionSectionProps = {
  image: string;
  title: string;
  description: string;
  maxLines?: number;
};

const MasterPlan = ({
  image,
  title,
  description,
  maxLines = 6,
}: ImageDescriptionSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const maxHeight = lineHeight * maxLines;

    if (el.scrollHeight > maxHeight) {
      setShowButton(true);
    }
  }, [description, maxLines]);

  return (
    <div className="max-w-7xl mx-auto w-full my-12 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      
      <div className="grid grid-cols-1 md:grid-cols-11 h-full">
        
        {/* Image - 45% */}
        <div className="md:col-span-5 relative h-[240px] sm:h-[300px] md:h-auto">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />

          {/* subtle overlay for premium feel */}
          <div className="absolute inset-0 bg-black/5" />
        </div>

        {/* Description - 55% */}
        <div className="md:col-span-6 p-5 sm:p-6 flex flex-col justify-between">
          
          <div>
            {/* Title */}
            <h2 className="bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent font-bold text-2xl mb-3">
              {title} <span className="text-gray-500 font-medium">– Master Plan</span>
            </h2>

            {/* Divider */}
            <div className="border-b border-gray-200 mb-4" />

            {/* Description */}
            <div className="relative">
              <p
                ref={textRef}
                className="text-gray-700 text-sm sm:text-[15px] leading-6 sm:leading-7 transition-all duration-300 overflow-hidden"
                style={
                  expanded
                    ? {}
                    : {
                        display: "-webkit-box",
                        WebkitLineClamp: maxLines,
                        WebkitBoxOrient: "vertical",
                      }
                }
              >
                {description}
              </p>

              {/* Fade when collapsed */}

            </div>
          </div>

          {/* Read More / Less */}
          {showButton && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-blue-600 text-sm font-medium hover:underline self-start"
            >
              {expanded ? "Read less" : "Read more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterPlan;