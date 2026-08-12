"use client";

import { useEffect, useState } from "react";
import { Camera, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AgentProfileEditModal from "./AgentProfileEditModal";
import type { AgentCoreValues, AgentExtendedValues } from "./AgentProfileForm";

function formatDob(dob: string): string {
  // Parsed from the y/m/d parts (not `new Date(isoString)`) so a UTC-midnight
  // ISO date never shifts a day earlier in a behind-UTC timezone.
  const [y, m, d] = dob.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-white/[0.06] last:border-0">
      <span className="text-[13px] text-gray-500">{label}</span>
      <span className="text-[14px] text-white text-right">{value}</span>
    </div>
  );
}

export default function AgentProfileView() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AgentExtendedValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch("/api/agent-profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile({
          dob: data.profile?.dob ?? "",
          pincode: data.profile?.pincode ?? "",
          preferredLanguage: data.profile?.preferredLanguage ?? null,
          profilePhotoUrl: data.profile?.profilePhotoUrl ?? null,
        });
      })
      .catch(() => setProfile({ dob: "", pincode: "", preferredLanguage: null, profilePhotoUrl: null }))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !user || !profile) {
    return <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-[#141416]" />;
  }

  const core: AgentCoreValues = { name: user.name, phone: user.phone, city: user.city };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#1a1a1d]">
          {profile.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profilePhotoUrl}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-500">
              <Camera size={24} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">{user.name}</h2>
          <p className="text-sm text-gray-400 truncate">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#D9B268]/40 px-5 py-2.5 text-sm font-semibold text-[#D9B268] hover:bg-[#D9B268]/10 transition cursor-pointer shrink-0"
        >
          <Pencil size={14} />
          Edit Profile
        </button>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4">
        <InfoRow label="Phone Number" value={user.phone} />
        <InfoRow label="City" value={user.city} />
        <InfoRow label="Date of Birth" value={profile.dob ? formatDob(profile.dob) : "Not set"} />
        <InfoRow label="Pincode" value={profile.pincode || "Not set"} />
        <InfoRow label="Preferred Language" value={profile.preferredLanguage || "Not set"} />
      </div>

      {editing && (
        <AgentProfileEditModal
          userId={user.id}
          email={user.email}
          initialCore={core}
          initialProfile={profile}
          onSaved={(_updatedCore, updatedProfile) => {
            setProfile(updatedProfile);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
