"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

const inputClass =
  "p-3 border border-gray-600 rounded-md bg-transparent focus:bg-white focus:text-black outline-none";

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
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent">
        Log In
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
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
          className="mt-2 p-3 rounded-md bg-white text-black font-semibold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={openSignup} className="text-[#CEA44E] font-medium cursor-pointer">
          Sign up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
