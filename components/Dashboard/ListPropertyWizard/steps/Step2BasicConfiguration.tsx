"use client";

import FormField, { inputClass } from "@/components/Form/FormField";
import ChipGroup from "@/components/Form/ChipGroup";
import { useListPropertyForm } from "../ListPropertyFormContext";
import {
  AVAILABLE_FROM_OPTIONS,
  AGE_OF_PROPERTY_OPTIONS,
  BATHROOM_OPTIONS,
  PARKING_OPTIONS,
  BALCONY_OPTIONS,
} from "../constants";

export default function Step2BasicConfiguration() {
  const { formState, updateConfiguration } = useListPropertyForm();
  const { configuration } = formState;

  return (
    <div className="flex flex-col gap-6">
      <FormField label="Available From">
        <ChipGroup
          mode="single"
          options={AVAILABLE_FROM_OPTIONS}
          value={configuration.availableFromType}
          onChange={(v) => updateConfiguration({ availableFromType: v as typeof configuration.availableFromType })}
        />
        {configuration.availableFromType === "Later" && (
          <input
            type="date"
            value={configuration.availableFromDate}
            onChange={(e) => updateConfiguration({ availableFromDate: e.target.value })}
            className={`${inputClass} mt-2`}
          />
        )}
      </FormField>

      <FormField label="Age of Property (Years)">
        <ChipGroup
          mode="single"
          options={AGE_OF_PROPERTY_OPTIONS}
          value={configuration.ageOfProperty}
          onChange={(v) => updateConfiguration({ ageOfProperty: v as typeof configuration.ageOfProperty })}
        />
      </FormField>

      <FormField label="Bathroom">
        <ChipGroup
          mode="single"
          options={BATHROOM_OPTIONS}
          value={configuration.bathrooms}
          onChange={(v) => updateConfiguration({ bathrooms: v as typeof configuration.bathrooms })}
        />
      </FormField>

      <FormField label="Covered Parking">
        <ChipGroup
          mode="single"
          options={PARKING_OPTIONS}
          value={configuration.coveredParking}
          onChange={(v) => updateConfiguration({ coveredParking: v as typeof configuration.coveredParking })}
        />
      </FormField>

      <FormField label="Open/Uncovered Parking">
        <ChipGroup
          mode="single"
          options={PARKING_OPTIONS}
          value={configuration.openParking}
          onChange={(v) => updateConfiguration({ openParking: v as typeof configuration.openParking })}
        />
      </FormField>

      <FormField label="Balcony">
        <ChipGroup
          mode="multi"
          options={BALCONY_OPTIONS}
          value={configuration.balcony}
          onChange={(v) => updateConfiguration({ balcony: v as typeof configuration.balcony })}
        />
      </FormField>
    </div>
  );
}
