"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import CoreProfileFields from "@/components/Common/CoreProfileFields";

export default function CustomerProfileForm() {
  const { user, refresh } = useAuth();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      setCity(user.city);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, city }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }
      toast.success("Profile updated!");
      await refresh();
    } catch {
      toast.error("Server error — please try again");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-[#141416] p-6">
      <CoreProfileFields
        email={user.email}
        name={name}
        onNameChange={setName}
        phone={phone}
        onPhoneChange={setPhone}
        city={city}
        onCityChange={setCity}
        disabled={saving}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-6 py-3 font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}
