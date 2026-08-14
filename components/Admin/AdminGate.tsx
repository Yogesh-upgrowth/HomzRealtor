"use client";

import { useState } from "react";
import AdminLoginForm from "./AdminLoginForm";
import AdminApplyForm from "./AdminApplyForm";

type AdminGateProps = {
  variant: "logged-out" | "not-admin";
};

// Self-contained login/apply panel for /admin — deliberately not wired
// through the public AuthModalContext, since this flow has a fixed
// loginAs: "admin" and a different apply-form shape. Submitting the login
// form here always just authenticates the given credentials (overwriting
// whatever session, if any, currently exists), so both variants render the
// same panel underneath — only the headline copy differs.
export default function AdminGate({ variant }: AdminGateProps) {
  const [mode, setMode] = useState<"login" | "apply">("login");

  return (
    <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141416] p-8 sm:p-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268] text-center">
          HomzRealtor Admin
        </p>
        <h1 className="text-xl font-bold text-white mb-2 text-center">
          {variant === "logged-out" ? "Sign in to access the admin portal" : "Admins only"}
        </h1>
        <p className="text-gray-400 text-sm mb-6 text-center">
          {variant === "logged-out"
            ? "Log in with an admin account, or apply for access below."
            : "Your current account doesn't have admin access. Log in with an admin account below."}
        </p>

        {mode === "login" ? (
          <AdminLoginForm onSwitchToApply={() => setMode("apply")} />
        ) : (
          <AdminApplyForm onSwitchToLogin={() => setMode("login")} />
        )}
      </div>
    </div>
  );
}
