import { z } from "zod";

// Same 5 cities as CITY_DISPLAY in lib/intelligence/projects.ts — the ones
// the site actually covers. Kept as a separate literal list here (not
// imported) so the auth module doesn't depend on the scraping module's
// internal city-key naming (ggn, gNoida, ...).
export const SIGNUP_CITIES = ["Gurgaon", "Noida", "Greater Noida", "Delhi", "Faridabad"] as const;

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  city: z.enum(SIGNUP_CITIES),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  role: z.enum(["customer", "agent"]),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Shared by the customer's /account page and the agent's core-fields section
// on /dashboard/profile — email and password are deliberately not editable
// here (email is the login identifier; password change is a separate flow).
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  city: z.enum(SIGNUP_CITIES),
});

// Grant/revoke plain "admin" — used by PATCH /api/admin/users/[id]/role.
// "super_admin" is deliberately not an option here: that tier only ever
// changes via scripts/set-user-role.mjs, never through the app.
export const updateUserRoleSchema = z.object({
  role: z.enum(["customer", "agent", "admin"]),
});
