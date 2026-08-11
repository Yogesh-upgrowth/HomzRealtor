import type { ListPropertyFormState, StepErrors } from "./types";

type StepResult = { valid: boolean; errors: StepErrors };

const ok: StepResult = { valid: true, errors: {} };

function fail(errors: StepErrors): StepResult {
  return { valid: false, errors };
}

export function validateStep1(state: ListPropertyFormState): StepResult {
  const { basicInfo } = state;
  const errors: StepErrors = {};

  if (!basicInfo.listingType) errors.listingType = "Select Sale or Rent";
  if (!basicInfo.propertyType) errors.propertyType = "Select a property type";
  if (!basicInfo.city.trim()) errors.city = "City is required";
  if (!basicInfo.locality.trim()) errors.locality = "Locality/Society is required";
  if (!basicInfo.bhk) errors.bhk = "Select a configuration";
  if (!basicInfo.suitedFor) errors.suitedFor = "Select who it's suited for";
  const hasArea = basicInfo.areaDetails.some((a) => Number(a.areaSize) > 0);
  if (!hasArea) errors.areaDetails = "Enter an area size";
  if (!basicInfo.priceAmount || Number(basicInfo.priceAmount) <= 0) {
    errors.priceAmount = "Enter a valid price";
  }
  if (basicInfo.listingType === "Rent" && !basicInfo.securityDeposit) {
    errors.securityDeposit = "Security deposit is required for rentals";
  }

  return Object.keys(errors).length > 0 ? fail(errors) : ok;
}

export function validateStep2(): StepResult {
  return ok; // every field on this step is an optional refinement per the reference screenshots
}

export function validateStep3(state: ListPropertyFormState): StepResult {
  const doneImages = state.media.images.filter((i) => i.status === "done" && i.url);
  if (doneImages.length === 0) {
    return fail({ images: "At least one photo is required" });
  }
  return ok;
}

export function validateStep4(state: ListPropertyFormState): StepResult {
  if (!state.detailedConfig.furnishingStatus) {
    return fail({ furnishingStatus: "Select a furnishing status" });
  }
  return ok;
}

export function validateStep5(state: ListPropertyFormState): StepResult {
  const errors: StepErrors = {};
  const oneLine = state.description.oneLineDescription.trim();
  if (!oneLine) {
    errors.oneLineDescription = "One line description is required";
  } else if (oneLine.split(/\s+/).length > 20) {
    errors.oneLineDescription = "Max 20 words";
  }
  if (state.description.propertyDescription.trim().length < 30) {
    errors.propertyDescription = "Please write a fuller description (min 30 characters)";
  }
  return Object.keys(errors).length > 0 ? fail(errors) : ok;
}

export function validateStep(step: number, state: ListPropertyFormState): StepResult {
  switch (step) {
    case 1:
      return validateStep1(state);
    case 2:
      return validateStep2();
    case 3:
      return validateStep3(state);
    case 4:
      return validateStep4(state);
    case 5:
      return validateStep5(state);
    default:
      return ok;
  }
}
