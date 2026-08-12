"use client";

import { useAuthModal } from "@/context/AuthModalContext";

type AdminGateProps = {
  variant: "logged-out" | "not-admin";
};

// Header/Footer render null on /admin paths, so this gate carries its own
// entry point into the login modal rather than pointing at a header button
// that isn't visible here — the modal itself is mounted at the root layout,
// independent of Header, so openLogin() still works.
export default function AdminGate({ variant }: AdminGateProps) {
  const { openLogin } = useAuthModal();

  return (
    <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141416] p-10 text-center">
        {variant === "logged-out" ? (
          <>
            <h1 className="text-xl font-bold text-white mb-2">Sign in to access the admin portal</h1>
            <p className="text-gray-400 text-sm mb-6">
              Use the &quot;Login as Admin&quot; button after signing in.
            </p>
            <button
              onClick={openLogin}
              className="w-full rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 font-bold text-[#1c1608] hover:brightness-105 transition cursor-pointer"
            >
              Log In
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-white mb-2">Admins only</h1>
            <p className="text-gray-400 text-sm">
              Your account doesn&apos;t have admin access on HomzRealtor.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
