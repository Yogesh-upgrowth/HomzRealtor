import { z } from "zod";

const MIN_AGENT_AGE = 18;

function isValidDateString(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function isAtLeastAge(value: string, years: number): boolean {
  const dob = new Date(value);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);
  return dob <= cutoff;
}

export const updateAgentProfileSchema = z.object({
  dob: z
    .string()
    .refine(isValidDateString, "Enter a valid date of birth")
    .refine((v) => isAtLeastAge(v, MIN_AGENT_AGE), `You must be at least ${MIN_AGENT_AGE} years old`)
    .nullable(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode")
    .nullable(),
  preferredLanguage: z.string().trim().min(1).max(40).nullable(),
  profilePhotoUrl: z.string().url().nullable(),
});

export type UpdateAgentProfileInput = z.infer<typeof updateAgentProfileSchema>;
