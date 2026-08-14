"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-3.5 text-[14.5px] text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors";

type AdminLoginFormProps = {
  onSwitchToApply: () => void;
};

export default function AdminLoginForm({ onSwitchToApply }: AdminLoginFormProps) {
  const router = useRouter();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, loginAs: "admin" }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }

      await refresh();
      // The dashboard is a server-rendered gate (app/admin/layout.tsx) that
      // reads the session cookie fresh on every request — refresh() is what
      // makes it re-evaluate and show the dashboard now that login succeeded.
      router.refresh();
    } catch {
      toast.error("Server error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-sm">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={inputClass}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className={inputClass}
      />

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? "Logging in..." : "Login as Admin"}
      </button>

      <p className="text-center text-gray-400 text-sm mt-2">
        Don&apos;t have admin access?{" "}
        <button
          type="button"
          onClick={onSwitchToApply}
          className="text-[#D9B268] font-semibold cursor-pointer hover:opacity-80 transition"
        >
          Apply here
        </button>
      </p>
    </form>
  );
}
