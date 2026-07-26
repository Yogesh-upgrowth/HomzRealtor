"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-3.5 text-[14.5px] text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors";

const SignupForm = () => {
  const router = useRouter();
  const { refresh } = useAuth();
  const { openLogin, close } = useAuthModal();

  const [role, setRole] = useState<AuthUser["role"]>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }

      toast.success("Account created!");
      await refresh();
      close();
      router.refresh();
    } catch {
      toast.error("Server error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md pt-6">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268] text-center">
        Join Homz Realtor
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-7 bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] bg-clip-text text-transparent">
        Create Your Account
      </h2>

      {/* Role toggle */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {(["customer", "agent"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-xl px-4 py-3 font-semibold capitalize transition cursor-pointer ${
              role === r
                ? "bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] text-[#1c1608]"
                : "border border-white/10 text-gray-300 hover:border-[#D9B268]/40 hover:text-[#D9B268]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

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
          type="password"
          placeholder="Password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className={inputClass}
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : `Sign Up as ${role === "agent" ? "Agent" : "Customer"}`}
        </button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        Already have an account?{" "}
        <button type="button" onClick={openLogin} className="text-[#D9B268] font-semibold cursor-pointer hover:opacity-80 transition">
          Log in
        </button>
      </p>
    </div>
  );
};

export default SignupForm;
