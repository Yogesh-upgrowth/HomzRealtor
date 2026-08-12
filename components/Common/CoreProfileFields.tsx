"use client";

import FormField, { inputClass, selectClass } from "@/components/Form/FormField";
import { SIGNUP_CITIES } from "@/lib/auth/validation";

// Shared by CustomerProfileForm (/account) and AgentProfileForm
// (/dashboard/profile) — both edit the same users fields via PATCH
// /api/account. Email is shown but not editable (it's the login identifier).

type CoreProfileFieldsProps = {
  email: string;
  name: string;
  onNameChange: (value: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  disabled?: boolean;
};

export default function CoreProfileFields({
  email,
  name,
  onNameChange,
  phone,
  onPhoneChange,
  city,
  onCityChange,
  disabled,
}: CoreProfileFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <FormField label="Email" helperText="Your email can't be changed here.">
        <input type="email" value={email} disabled readOnly className={`${inputClass} opacity-60`} />
      </FormField>

      <FormField label="Full Name" required>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={disabled}
          minLength={2}
          required
          className={inputClass}
        />
      </FormField>

      <FormField label="Phone Number" required>
        <input
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          disabled={disabled}
          pattern="[6-9]\d{9}"
          title="Enter a valid 10-digit mobile number"
          required
          className={inputClass}
        />
      </FormField>

      <FormField label="City" required>
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={disabled}
          required
          className={selectClass}
        >
          <option value="" disabled>
            Select your city
          </option>
          {SIGNUP_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}
