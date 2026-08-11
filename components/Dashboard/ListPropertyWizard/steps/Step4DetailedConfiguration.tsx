"use client";

import FormField, { inputClass, selectClass } from "@/components/Form/FormField";
import ChipGroup from "@/components/Form/ChipGroup";
import { useListPropertyForm } from "../ListPropertyFormContext";
import {
  FURNISHING_STATUS_OPTIONS,
  POWER_BACKUP_OPTIONS,
  FACING_OPTIONS,
  VIEW_OPTIONS,
  AMENITY_CATEGORIES,
} from "../constants";
import type { AmenityCategory } from "@/lib/properties/types";

export default function Step4DetailedConfiguration() {
  const { formState, updateDetailedConfig, errors } = useListPropertyForm();
  const { detailedConfig } = formState;

  const toggleAmenity = (category: AmenityCategory, next: string | string[]) => {
    updateDetailedConfig({
      amenities: { ...detailedConfig.amenities, [category]: next as string[] },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <FormField label="Furnishing Status" required error={errors.furnishingStatus}>
        <ChipGroup
          mode="single"
          options={FURNISHING_STATUS_OPTIONS}
          value={detailedConfig.furnishingStatus}
          onChange={(v) => updateDetailedConfig({ furnishingStatus: v as typeof detailedConfig.furnishingStatus })}
        />
      </FormField>

      <FormField label="Power Back-up">
        <ChipGroup
          mode="single"
          options={POWER_BACKUP_OPTIONS}
          value={detailedConfig.powerBackup}
          onChange={(v) => updateDetailedConfig({ powerBackup: v as typeof detailedConfig.powerBackup })}
        />
      </FormField>

      <FormField label="Facing">
        <select
          value={detailedConfig.facing}
          onChange={(e) => updateDetailedConfig({ facing: e.target.value })}
          className={selectClass}
        >
          <option value="">Select Facing</option>
          {FACING_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="View">
        <select
          value={detailedConfig.view}
          onChange={(e) => updateDetailedConfig({ view: e.target.value })}
          className={selectClass}
        >
          <option value="">Select View</option>
          {VIEW_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Floor Number">
        <input
          type="number"
          placeholder="Floor Number"
          value={detailedConfig.floorNumber}
          onChange={(e) => updateDetailedConfig({ floorNumber: e.target.value })}
          className={inputClass}
        />
      </FormField>

      <FormField label="Total Floor Count">
        <input
          type="number"
          placeholder="Total Floor Count"
          value={detailedConfig.totalFloorCount}
          onChange={(e) => updateDetailedConfig({ totalFloorCount: e.target.value })}
          className={inputClass}
        />
      </FormField>

      <FormField
        label="Connecting Road Width"
        helperText="Max limit (300 in Feet/100 in Meter)"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            min={0}
            placeholder="Connecting Road Width"
            value={detailedConfig.connectingRoadWidth}
            onChange={(e) => updateDetailedConfig({ connectingRoadWidth: e.target.value })}
            className={`${inputClass} min-w-0`}
          />
          <select
            value={detailedConfig.connectingRoadWidthUnit}
            onChange={(e) =>
              updateDetailedConfig({ connectingRoadWidthUnit: e.target.value as "Feet" | "Meter" })
            }
            className={`${selectClass} w-full sm:w-[110px] sm:shrink-0`}
          >
            <option value="Feet">Feet</option>
            <option value="Meter">Meter</option>
          </select>
        </div>
      </FormField>

      <FormField label="Amenities">
        <div className="flex flex-col gap-3">
          {AMENITY_CATEGORIES.map(({ category, items }) => (
            <details key={category} className="group rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-white font-medium text-[14px]">
                <span>{category}</span>
                <span className="text-[#D9B268] text-lg transition-transform group-open:rotate-45 shrink-0">
                  +
                </span>
              </summary>
              <div className="mt-3">
                <ChipGroup
                  mode="multi"
                  options={items}
                  value={detailedConfig.amenities[category] ?? []}
                  onChange={(v) => toggleAmenity(category, v)}
                />
              </div>
            </details>
          ))}
        </div>
      </FormField>
    </div>
  );
}
