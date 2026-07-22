"use client";

import { useAuthModal } from "@/context/AuthModalContext";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

const AuthModal = () => {
  const { mode, close } = useAuthModal();

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md bg-[#1c1c1c] text-white rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={close}
          className="absolute top-3 right-3 text-gray-300 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>

        {mode === "login" ? <LoginForm /> : <SignupForm />}
      </div>
    </div>
  );
};

export default AuthModal;
