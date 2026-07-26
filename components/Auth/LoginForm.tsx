"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-3.5 text-[14.5px] text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors";

const LoginForm = () => {
  const router = useRouter();
  const { refresh } = useAuth();
  const { openSignup, close } = useAuthModal();

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
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }

      toast.success(`Welcome back, ${data.user.name}!`);
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
    <div className="w-full max-w-md">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268] text-center">
        Welcome back
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-7 bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] bg-clip-text text-transparent">
        Log In
      </h2>

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
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={openSignup} className="text-[#D9B268] font-semibold cursor-pointer hover:opacity-80 transition">
          Sign up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
