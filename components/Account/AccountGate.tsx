"use client";

import { useAuthModal } from "@/context/AuthModalContext";

export default function AccountGate() {
  const { openLogin, openSignup } = useAuthModal();

  return (
    <div className="min-h-screen bg-[#0B0B0C] pt-32 pb-16">
      <div className="max-w-md mx-auto px-4">
        <div className="rounded-2xl border border-white/10 bg-[#141416] p-10 text-center">
          <h1 className="text-xl font-bold text-white mb-2">Sign in to view your account</h1>
          <p className="text-gray-400 text-sm mb-6">Log in to see and edit your profile details.</p>
          <button
            onClick={openLogin}
            className="w-full rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 font-bold text-[#1c1608] hover:brightness-105 transition cursor-pointer"
          >
            Log In
          </button>
          <button
            onClick={openSignup}
            className="mt-3 text-sm text-gray-400 hover:text-[#D9B268] transition cursor-pointer"
          >
            New here? Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
