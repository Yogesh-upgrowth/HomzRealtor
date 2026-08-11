"use client";

import FormField, { inputClass } from "@/components/Form/FormField";
import ChipGroup from "@/components/Form/ChipGroup";
import ImageUploader from "@/components/Form/ImageUploader";
import { useListPropertyForm } from "../ListPropertyFormContext";
import { IMAGE_TAG_OPTIONS, PROPERTY_HIGHLIGHT_OPTIONS } from "../constants";

export default function Step3MediaHighlights() {
  const { formState, updateMedia, clientTempId, errors } = useListPropertyForm();
  const { media } = formState;

  return (
    <div className="flex flex-col gap-6">
      <FormField label="Photos" required error={errors.images}>
        <ImageUploader
          kind="image"
          items={media.images}
          onChange={(images) => updateMedia({ images })}
          clientTempId={clientTempId}
          minRequiredHint="At least 1 image is required. We recommend uploading 5 or more images for better leads."
          tagOptions={IMAGE_TAG_OPTIONS}
        />
      </FormField>

      <FormField label="Video" helperText="Listings with videos convert 35% more">
        <ImageUploader
          kind="video"
          items={media.videos}
          onChange={(videos) => updateMedia({ videos })}
          clientTempId={clientTempId}
          maxItems={1}
        />
      </FormField>

      <FormField label="Flooring">
        <input
          type="text"
          placeholder="e.g. Marble"
          value={media.flooring}
          onChange={(e) => updateMedia({ flooring: e.target.value })}
          className={inputClass}
        />
      </FormField>

      <FormField label="Tower/Block">
        <input
          type="text"
          placeholder="Tower/Block"
          value={media.towerBlock}
          onChange={(e) => updateMedia({ towerBlock: e.target.value })}
          className={inputClass}
        />
      </FormField>

      <FormField label="Unit No">
        <input
          type="text"
          placeholder="Unit No"
          value={media.unitNo}
          onChange={(e) => updateMedia({ unitNo: e.target.value })}
          className={inputClass}
        />
        <label className="mt-2 flex items-center gap-2 text-[13px] text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={media.unitNoPrivate}
            onChange={(e) => updateMedia({ unitNoPrivate: e.target.checked })}
            className="accent-[#D9B268]"
          />
          Keep it private
        </label>
      </FormField>

      <FormField label="Property Highlights">
        <ChipGroup
          mode="multi"
          options={PROPERTY_HIGHLIGHT_OPTIONS}
          value={media.highlights}
          onChange={(v) => updateMedia({ highlights: v as typeof media.highlights })}
        />
      </FormField>
    </div>
  );
}
