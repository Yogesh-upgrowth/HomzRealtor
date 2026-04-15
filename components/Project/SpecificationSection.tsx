"use client";

import React from "react";

type Specification = {
  label: string;
  value: string;
};

type SpecificationsSectionProps = {
  title: string;
  specs: Specification[];
};

const SpecificationItem: React.FC<Specification> = ({ label, value }) => {
  return (
    <div className="flex justify-between py-4 border-b last:border-b-0">
      <p className="text-gray-800 font-medium">{label}</p>
      <p className="text-gray-600">{value}</p>
    </div>
  );
};

const SpecificationsSection: React.FC<SpecificationsSectionProps> = ({
  title,
  specs,
}) => {
  return (
    <div className="w-full max-w-5xl bg-gray-50 border rounded-xl p-6">
      
      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-800">
        {title}
      </h2>

      <div className="border-t my-4" />

      {/* Specs List */}
      <div>
        {specs.map((item, i) => (
          <SpecificationItem key={i} {...item} />
        ))}
      </div>
    </div>
  );
};

export default SpecificationsSection;