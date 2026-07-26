"use client";

import { X } from "lucide-react";
import { useAuthModal } from "@/context/AuthModalContext";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

const AuthModal = () => {
  const { mode, close } = useAuthModal();

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md rounded-[24px] border border-white/10 bg-[#141416] text-white shadow-[0_30px_90px_rgba(0,0,0,0.6)] p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={close}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-300 hover:border-[#D9B268] hover:text-[#D9B268] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {mode === "login" ? <LoginForm /> : <SignupForm />}
      </div>
    </div>
  );
};

export default AuthModal;
