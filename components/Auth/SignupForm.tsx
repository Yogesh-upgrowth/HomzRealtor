"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

const inputClass =
  "p-3 border border-gray-600 rounded-md bg-transparent focus:bg-white focus:text-black outline-none";

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
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent">
        Create Your Account
      </h2>

      {/* Role toggle */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(["customer", "agent"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`p-3 rounded-md font-semibold capitalize transition cursor-pointer ${
              role === r
                ? "bg-gradient-to-r from-[#FDF094] to-[#B77D2B] text-black"
                : "border border-gray-600 text-gray-300 hover:border-[#B77D2B] hover:text-[#B77D2B]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
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
          className="mt-2 p-3 rounded-md bg-white text-black font-semibold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : `Sign Up as ${role === "agent" ? "Agent" : "Customer"}`}
        </button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        Already have an account?{" "}
        <button type="button" onClick={openLogin} className="text-[#CEA44E] font-medium cursor-pointer">
          Log in
        </button>
      </p>
    </div>
  );
};

export default SignupForm;
