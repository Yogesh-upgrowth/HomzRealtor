"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/context/AuthModalContext";

// Anyone landing directly on /login or /signup (bookmark, shared link, etc.)
// gets sent home with the matching modal already open, so login/signup is
// always the floating modal experience, never a plain white page.
const OpenAuthModalRedirect = ({ mode }: { mode: "login" | "signup" }) => {
  const router = useRouter();
  const { openLogin, openSignup } = useAuthModal();

  useEffect(() => {
    if (mode === "login") openLogin();
    else openSignup();
    router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default OpenAuthModalRedirect;
