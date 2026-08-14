"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SIGNUP_CITIES } from "@/lib/auth/validation";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-3.5 text-[14.5px] text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors";

const selectClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-3.5 text-[14.5px] text-white outline-none focus:border-[#D9B268] transition-colors";

type AdminApplyFormProps = {
  onSwitchToLogin: () => void;
};

export default function AdminApplyForm({ onSwitchToLogin }: AdminApplyFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, city, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Server error — please try again");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-bold text-white mb-2">Request submitted</h3>
        <p className="text-gray-400 text-sm mb-6">
          A super admin needs to approve your request before you can log in. Check back later.
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full rounded-xl border border-white/10 px-4 py-3.5 font-semibold text-gray-300 hover:border-white/20 transition cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-sm">
      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        minLength={2}
        className={inputClass}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={inputClass}
      />
      <input
        type="tel"
        placeholder="Phone Number (10 digits)"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
        required
        pattern="[6-9]\d{9}"
        title="Enter a valid 10-digit mobile number"
        className={inputClass}
      />
      <select value={city} onChange={(e) => setCity(e.target.value)} required className={selectClass}>
        <option value="" disabled>
          Select your city
        </option>
        {SIGNUP_CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="password"
        placeholder="Password (min. 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        className={inputClass}
      />

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? "Submitting..." : "Apply for Admin Access"}
      </button>

      <p className="text-center text-gray-400 text-sm mt-2">
        Already have admin access?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#D9B268] font-semibold cursor-pointer hover:opacity-80 transition"
        >
          Log in
        </button>
      </p>
    </form>
  );
}
