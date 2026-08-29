"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppHref } from "@/lib/intelligence/whatsapp";

// Page-scoped (rendered only inside app/page.tsx), not part of the global
// Header, so no shared-component changes needed.
const FloatingWhatsApp = () => {
  const href = buildWhatsAppHref("HomzRealtor properties in Gurgaon");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with a HomzRealtor advisor on WhatsApp"
      className="fixed bottom-20 right-5 z-[70] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] text-[#1c1608] shadow-[0_16px_40px_rgba(201,154,75,0.35)] transition hover:brightness-105 md:bottom-8 md:right-8"
    >
      <MessageCircle size={26} />
    </a>
  );
};

export default FloatingWhatsApp;
