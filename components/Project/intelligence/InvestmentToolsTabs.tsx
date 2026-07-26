"use client";

import { useState } from "react";
import SegmentedTabs from "@/components/Project/listing/SegmentedTabs";
import EmiCalculator from "./EmiCalculator";
import InvestmentCalculators from "./InvestmentCalculators";
import AcquisitionCostCalculator from "./AcquisitionCostCalculator";

type Props = {
  title: string;
  defaultPrice: number | null;
  state: string;
  propertyCategory: string;
  readyToMove: boolean;
};

const TABS = [
  { id: "emi", label: "EMI" },
  { id: "rental", label: "Rental Yield" },
  { id: "cost", label: "Acquisition Cost" },
];

// Thin tab wrapper around three already-built, already-dark calculators — no
// new calculation logic, just lets a visitor switch between them without
// scrolling past all three.
const InvestmentToolsTabs = ({ title, defaultPrice, state, propertyCategory, readyToMove }: Props) => {
  const [active, setActive] = useState("emi");

  return (
    <section id="calculators" className="w-full max-w-7xl mx-auto px-2 my-12 scroll-mt-24">
      <h2 className="text-2xl bg-gradient-to-b from-[#F2D79B] to-[#C99A4B] font-bold bg-clip-text text-transparent mb-1">
        Investment tools
      </h2>
      <p className="text-[15px] text-gray-500 mb-6">Run the numbers on {title}, live.</p>

      <SegmentedTabs tabs={TABS} active={active} onChange={setActive} />

      {active === "emi" && <EmiCalculator title={title} defaultPrice={defaultPrice} />}
      {active === "rental" && <InvestmentCalculators title={title} defaultPrice={defaultPrice} />}
      {active === "cost" && (
        <AcquisitionCostCalculator
          title={title}
          defaultPrice={defaultPrice}
          state={state}
          propertyCategory={propertyCategory}
          readyToMove={readyToMove}
        />
      )}
    </section>
  );
};

export default InvestmentToolsTabs;
