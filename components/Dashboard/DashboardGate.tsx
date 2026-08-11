"use client";

import { useAuthModal } from "@/context/AuthModalContext";

type DashboardGateProps = {
  variant: "logged-out" | "not-agent";
};

export default function DashboardGate({ variant }: DashboardGateProps) {
  const { openLogin, openSignup } = useAuthModal();

  return (
    <div className="min-h-screen bg-[#0B0B0C] pt-32 pb-16">
      <div className="max-w-md mx-auto px-4">
        <div className="rounded-2xl border border-white/10 bg-[#141416] p-10 text-center">
          {variant === "logged-out" ? (
            <>
              <h1 className="text-xl font-bold text-white mb-2">Sign in to access your dashboard</h1>
              <p className="text-gray-400 text-sm mb-6">
                You need an agent account to list properties on HomzRealtor.
              </p>
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
                New agent? Sign up
              </button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-2">This area is for agents only</h1>
              <p className="text-gray-400 text-sm mb-6">
                Your account is registered as a customer. To list properties, please create a separate
                agent account.
              </p>
              <button
                onClick={openSignup}
                className="w-full rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 font-bold text-[#1c1608] hover:brightness-105 transition cursor-pointer"
              >
                Sign up as an Agent
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
