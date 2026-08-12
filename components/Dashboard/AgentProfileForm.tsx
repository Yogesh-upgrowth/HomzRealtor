"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import AvatarUploader from "@/components/Form/AvatarUploader";
import FormField, { inputClass, selectClass } from "@/components/Form/FormField";
import { SIGNUP_CITIES } from "@/lib/auth/validation";

// The 22 languages of the Eighth Schedule of the Indian Constitution (the
// official/regional languages recognized across India's states), plus
// English (the other de facto official language) and a free-text "Other".
export const INDIAN_LANGUAGES = [
  "Assamese",
  "Bengali",
  "Bodo",
  "Dogri",
  "English",
  "Gujarati",
  "Hindi",
  "Kannada",
  "Kashmiri",
  "Konkani",
  "Maithili",
  "Malayalam",
  "Manipuri (Meitei)",
  "Marathi",
  "Nepali",
  "Odia",
  "Punjabi",
  "Sanskrit",
  "Santali",
  "Sindhi",
  "Tamil",
  "Telugu",
  "Urdu",
];

// Slightly tighter than the shared inputClass so a 2-column grid of fields
// fits this modal without a scrollbar — the shared constant stays untouched
// since it's also used by the (taller, single-column) 5-step wizard.
const compactInputClass = inputClass.replace("py-3.5", "py-2.5");

export type AgentCoreValues = { name: string; phone: string; city: string };
export type AgentExtendedValues = {
  dob: string;
  pincode: string;
  preferredLanguage: string | null;
  profilePhotoUrl: string | null;
};

type AgentProfileFormProps = {
  userId: string;
  email: string;
  initialCore: AgentCoreValues;
  initialProfile: AgentExtendedValues;
  onSaved: (core: AgentCoreValues, profile: AgentExtendedValues) => void;
  onCancel: () => void;
};

export default function AgentProfileForm({
  userId,
  email,
  initialCore,
  initialProfile,
  onSaved,
  onCancel,
}: AgentProfileFormProps) {
  const { refresh } = useAuth();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(initialCore.name);
  const [phone, setPhone] = useState(initialCore.phone);
  const [city, setCity] = useState(initialCore.city);

  const [dob, setDob] = useState(initialProfile.dob);
  const [pincode, setPincode] = useState(initialProfile.pincode);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(initialProfile.profilePhotoUrl);

  const initialKnownLanguage =
    initialProfile.preferredLanguage && INDIAN_LANGUAGES.includes(initialProfile.preferredLanguage);
  const [languageChoice, setLanguageChoice] = useState(
    initialProfile.preferredLanguage ? (initialKnownLanguage ? initialProfile.preferredLanguage : "Other") : ""
  );
  const [customLanguage, setCustomLanguage] = useState(
    initialProfile.preferredLanguage && !initialKnownLanguage ? initialProfile.preferredLanguage : ""
  );

  const handleSave = async () => {
    const preferredLanguage =
      languageChoice === "Other" ? customLanguage.trim() || null : languageChoice || null;

    setSaving(true);
    try {
      const [coreRes, profileRes] = await Promise.all([
        fetch("/api/account", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, city }),
        }),
        fetch("/api/agent-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dob: dob || null,
            pincode: pincode || null,
            preferredLanguage,
            profilePhotoUrl,
          }),
        }),
      ]);
      const coreData = await coreRes.json();
      const profileData = await profileRes.json();

      if (!coreRes.ok) {
        toast.error(coreData.error || "Something went wrong");
        return;
      }
      if (!profileRes.ok) {
        toast.error(profileData.error || "Something went wrong");
        return;
      }

      toast.success("Profile updated!");
      await refresh();
      onSaved(
        { name, phone, city },
        {
          dob: profileData.profile.dob ?? "",
          pincode: profileData.profile.pincode ?? "",
          preferredLanguage: profileData.profile.preferredLanguage,
          profilePhotoUrl: profileData.profile.profilePhotoUrl,
        }
      );
    } catch {
      toast.error("Server error — please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <FormField label="Email" helperText="Your email can't be changed here.">
          <input type="email" value={email} disabled readOnly className={`${compactInputClass} opacity-60`} />
        </FormField>
      </div>

      <FormField label="Full Name" required>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
          minLength={2}
          required
          className={compactInputClass}
        />
      </FormField>

      <FormField label="Phone Number" required>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          disabled={saving}
          pattern="[6-9]\d{9}"
          title="Enter a valid 10-digit mobile number"
          required
          className={compactInputClass}
        />
      </FormField>

      <FormField label="City" required>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={saving}
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

      <FormField label="Pincode">
        <input
          type="text"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          disabled={saving}
          placeholder="6-digit pincode"
          className={compactInputClass}
        />
      </FormField>

      <div className="col-span-2">
        <FormField label="Profile Photo">
          <AvatarUploader
            value={profilePhotoUrl}
            onChange={setProfilePhotoUrl}
            pathnamePrefix={`profile-photos/${userId}`}
          />
        </FormField>
      </div>

      <FormField label="Date of Birth">
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          disabled={saving}
          max={new Date().toISOString().slice(0, 10)}
          style={{ colorScheme: "dark" }}
          className={compactInputClass}
        />
      </FormField>

      <FormField label="Preferred Language">
        <select
          value={languageChoice}
          onChange={(e) => setLanguageChoice(e.target.value)}
          disabled={saving}
          className={selectClass}
        >
          <option value="">Select a language</option>
          {INDIAN_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      </FormField>

      {languageChoice === "Other" && (
        <div className="col-span-2">
          <input
            type="text"
            value={customLanguage}
            onChange={(e) => setCustomLanguage(e.target.value)}
            disabled={saving}
            placeholder="Enter your preferred language"
            className={compactInputClass}
          />
        </div>
      )}

      <div className="col-span-2 flex gap-3 mt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-xl border border-white/10 px-6 py-2.5 font-semibold text-gray-300 hover:border-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-6 py-2.5 font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
