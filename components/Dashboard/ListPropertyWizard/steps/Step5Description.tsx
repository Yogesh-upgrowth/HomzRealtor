"use client";

import FormField, { inputClass } from "@/components/Form/FormField";
import { useListPropertyForm } from "../ListPropertyFormContext";

export default function Step5Description() {
  const { formState, updateDescription, errors } = useListPropertyForm();
  const { description } = formState;
  const wordCount = description.oneLineDescription.trim()
    ? description.oneLineDescription.trim().split(/\s+/).length
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <FormField
        label="One line description"
        required
        error={errors.oneLineDescription}
        helperText={!errors.oneLineDescription ? `${wordCount}/20 words — a catchy title increases views by up to 30%` : undefined}
      >
        <input
          type="text"
          placeholder="One line description (max 20 words)"
          value={description.oneLineDescription}
          onChange={(e) => updateDescription({ oneLineDescription: e.target.value })}
          className={inputClass}
        />
      </FormField>

      <FormField
        label="Property Description"
        required
        error={errors.propertyDescription}
        helperText={!errors.propertyDescription ? "Write 25-30+ words for better ranking" : undefined}
      >
        <textarea
          rows={8}
          placeholder="Describe your property..."
          value={description.propertyDescription}
          onChange={(e) => updateDescription({ propertyDescription: e.target.value })}
          className={`${inputClass} resize-y`}
        />
      </FormField>
    </div>
  );
}
