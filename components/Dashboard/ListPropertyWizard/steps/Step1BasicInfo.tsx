"use client";

import { Plus, Trash2 } from "lucide-react";
import FormField, { inputClass, selectClass } from "@/components/Form/FormField";
import ChipGroup from "@/components/Form/ChipGroup";
import SegmentedToggle from "@/components/Form/SegmentedToggle";
import { useListPropertyForm } from "../ListPropertyFormContext";
import {
  PROPERTY_TYPE_OPTIONS,
  BHK_OPTIONS,
  ADDITIONAL_SPACE_OPTIONS,
  SUITED_FOR_OPTIONS,
  SECURITY_DEPOSIT_OPTIONS,
  AREA_TYPE_OPTIONS,
  RENT_PRICE_UNIT_OPTIONS,
  SALE_PRICE_UNIT_OPTIONS,
  MAINTENANCE_UNIT_OPTIONS,
} from "../constants";
import type { AreaDetailField } from "../types";

export default function Step1BasicInfo() {
  const { formState, updateBasicInfo, errors } = useListPropertyForm();
  const { basicInfo } = formState;
  const priceUnitOptions = basicInfo.listingType === "Sale" ? SALE_PRICE_UNIT_OPTIONS : RENT_PRICE_UNIT_OPTIONS;

  const updateAreaDetail = (index: number, patch: Partial<AreaDetailField>) => {
    const next = basicInfo.areaDetails.map((a, i) => (i === index ? { ...a, ...patch } : a));
    updateBasicInfo({ areaDetails: next });
  };

  const addAreaDetail = () => {
    updateBasicInfo({
      areaDetails: [...basicInfo.areaDetails, { areaSize: "", areaType: "Carpet Area", isDisplay: false }],
    });
  };

  const removeAreaDetail = (index: number) => {
    updateBasicInfo({ areaDetails: basicInfo.areaDetails.filter((_, i) => i !== index) });
  };

  return (
    <div className="flex flex-col gap-6">
      <FormField label="Listing Type" required error={errors.listingType}>
        <SegmentedToggle
          options={[
            { value: "Sale", label: "Sale" },
            { value: "Rent", label: "Rent" },
          ]}
          value={basicInfo.listingType}
          onChange={(v) => updateBasicInfo({ listingType: v as typeof basicInfo.listingType })}
        />
      </FormField>

      <FormField label="Building Type">
        <SegmentedToggle
          options={[
            { value: "Residential", label: "Residential" },
            { value: "Commercial", label: "Commercial" },
          ]}
          value={basicInfo.buildingType}
          onChange={(v) => updateBasicInfo({ buildingType: v as typeof basicInfo.buildingType })}
        />
      </FormField>

      <FormField label="Property Type" required error={errors.propertyType}>
        <ChipGroup
          mode="single"
          options={PROPERTY_TYPE_OPTIONS}
          value={basicInfo.propertyType}
          onChange={(v) => updateBasicInfo({ propertyType: v as typeof basicInfo.propertyType })}
        />
      </FormField>

      <FormField label="City" required error={errors.city}>
        <input
          type="text"
          placeholder="Please enter city name"
          value={basicInfo.city}
          onChange={(e) => updateBasicInfo({ city: e.target.value })}
          className={inputClass}
        />
      </FormField>

      <FormField label="Locality / Society" required error={errors.locality}>
        <input
          type="text"
          placeholder="Search for project or locality"
          value={basicInfo.locality}
          onChange={(e) => updateBasicInfo({ locality: e.target.value })}
          className={inputClass}
        />
      </FormField>

      <FormField label="Society" helperText="Optional">
        <input
          type="text"
          placeholder="Search for project"
          value={basicInfo.society}
          onChange={(e) => updateBasicInfo({ society: e.target.value })}
          className={inputClass}
        />
      </FormField>

      <FormField label="BHK" required error={errors.bhk}>
        <ChipGroup
          mode="single"
          options={BHK_OPTIONS}
          value={basicInfo.bhk}
          onChange={(v) => updateBasicInfo({ bhk: v as typeof basicInfo.bhk })}
        />
      </FormField>

      <FormField label="Additional Space options">
        <ChipGroup
          mode="multi"
          options={ADDITIONAL_SPACE_OPTIONS}
          value={basicInfo.additionalSpaces}
          onChange={(v) => updateBasicInfo({ additionalSpaces: v as typeof basicInfo.additionalSpaces })}
        />
      </FormField>

      <FormField label="Suited For" required error={errors.suitedFor}>
        <ChipGroup
          mode="single"
          options={SUITED_FOR_OPTIONS}
          value={basicInfo.suitedFor}
          onChange={(v) => updateBasicInfo({ suitedFor: v as typeof basicInfo.suitedFor })}
        />
      </FormField>

      <FormField label="Area Details" required error={errors.areaDetails}>
        <div className="flex flex-col gap-2">
          {basicInfo.areaDetails.map((area, i) => (
            <div key={i} className="flex gap-2 items-start sm:items-center">
              <div className="flex flex-1 min-w-0 flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Area size"
                  value={area.areaSize}
                  onChange={(e) => updateAreaDetail(i, { areaSize: e.target.value })}
                  className={`${inputClass} min-w-0`}
                />
                <select
                  value={area.areaType}
                  onChange={(e) => updateAreaDetail(i, { areaType: e.target.value })}
                  className={`${selectClass} w-full sm:w-[170px] sm:shrink-0`}
                >
                  {AREA_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {basicInfo.areaDetails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAreaDetail(i)}
                  className="shrink-0 mt-3.5 sm:mt-0 text-gray-500 hover:text-red-400 cursor-pointer"
                  aria-label="Remove area"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addAreaDetail}
            className="flex items-center gap-1 self-start text-[12.5px] font-semibold text-[#D9B268] hover:opacity-80 cursor-pointer"
          >
            <Plus size={13} />
            Add More Area Types
          </button>
        </div>
      </FormField>

      <FormField label="Price" required error={errors.priceAmount}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            min={0}
            placeholder="Please enter the property price"
            value={basicInfo.priceAmount}
            onChange={(e) => updateBasicInfo({ priceAmount: e.target.value })}
            className={`${inputClass} min-w-0`}
          />
          <select
            value={basicInfo.priceUnit}
            onChange={(e) => updateBasicInfo({ priceUnit: e.target.value })}
            className={`${selectClass} w-full sm:w-[140px] sm:shrink-0`}
          >
            {priceUnitOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </FormField>

      <FormField label="Maintenance">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            min={0}
            placeholder="Please enter your maintenance amount"
            value={basicInfo.maintenanceAmount}
            onChange={(e) => updateBasicInfo({ maintenanceAmount: e.target.value })}
            className={`${inputClass} min-w-0`}
          />
          <select
            value={basicInfo.maintenanceUnit}
            onChange={(e) => updateBasicInfo({ maintenanceUnit: e.target.value })}
            className={`${selectClass} w-full sm:w-[140px] sm:shrink-0`}
          >
            {MAINTENANCE_UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <label className="mt-2 flex items-center gap-2 text-[13px] text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={basicInfo.maintenanceIncludedInPrice}
            onChange={(e) => updateBasicInfo({ maintenanceIncludedInPrice: e.target.checked })}
            className="accent-[#D9B268]"
          />
          Included in Price
        </label>
      </FormField>

      {basicInfo.listingType === "Rent" && (
        <FormField label="Security Deposit" required error={errors.securityDeposit}>
          <ChipGroup
            mode="single"
            options={SECURITY_DEPOSIT_OPTIONS}
            value={basicInfo.securityDeposit}
            onChange={(v) => updateBasicInfo({ securityDeposit: v as typeof basicInfo.securityDeposit })}
          />
        </FormField>
      )}
    </div>
  );
}
