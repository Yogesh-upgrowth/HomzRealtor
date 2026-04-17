"use client";

import { useState, useRef, useEffect } from "react";

type ExpandableTextProps = {
  title: string;
  description: string[];
  maxLines?: number;
};

const ExpandableText = ({
  title,
  description,
  maxLines = 7,
}: ExpandableTextProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

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
    <div className="w-full max-w-7xl mx-auto bg-gray-100 rounded-lg p-6 mb-4">
      
      {/* Title */}
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-3">
        {"About  " + title}
      </h2>

      {/* Divider */}
      <div className="border-b border-gray-300 mb-4" />

      {/* Description */}
      <div
        ref={textRef}
        className="text-gray-700 text-[15px] leading-7 transition-all duration-300 overflow-hidden"
        style={
          expanded
            ? {}
            : {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {description.map((item, index) => (
          <p key={index} className="mb-3">
            {item}
          </p>
        ))}
      </div>

      {/* Show More / Less */}
      {showButton && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-blue-600 text-sm font-medium hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;