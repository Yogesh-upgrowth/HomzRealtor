"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAuthModal } from "@/context/AuthModalContext";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

const AuthModal = () => {
  const { mode, close } = useAuthModal();
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!mode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [close, mode]);

  if (!mode || !portalReady) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 pt-6 md:items-center md:px-4 md:py-8"
      onClick={close}
      role="presentation"
    >
      <div
        className="relative max-h-[calc(100dvh-24px)] w-full overflow-y-auto overscroll-contain rounded-t-[28px] border border-b-0 border-white/10 bg-[#141416] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-10 text-white shadow-[0_-24px_80px_rgba(0,0,0,0.65)] scrollbar-hide md:max-h-[90vh] md:max-w-md md:rounded-[24px] md:border-b md:p-8 md:shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "Log in" : "Create account"}
      >
        <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/15 md:hidden" aria-hidden="true" />
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 text-gray-300 transition-colors hover:border-[#D9B268] hover:text-[#D9B268]"
          aria-label="Close"
          data-testid="button-close-auth-sheet"
        >
          <X size={18} />
        </button>

        {mode === "login" ? <LoginForm /> : <SignupForm />}
      </div>
    </div>,
    document.body,
  );
};

export default AuthModal;
