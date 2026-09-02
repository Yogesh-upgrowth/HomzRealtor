"use client";

import { useEffect, useRef, useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { buildWhatsAppHref } from "@/lib/intelligence/whatsapp";

// Page-scoped (rendered only inside app/page.tsx), not part of the global
// Header, so no shared-component changes needed.
const FloatingWhatsApp = () => {
  const href = buildWhatsAppHref("HomzRealtor properties in Gurgaon");
  const [visible, setVisible] = useState(false);
  const lastScrollY = useRef(0);
  const hasScrolledDown = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    let frameId: number | null = null;

    const updateVisibility = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 120) {
        setVisible(false);
      } else if (delta > 4) {
        hasScrolledDown.current = true;
        setVisible(false);
      } else if (delta < -4 && hasScrolledDown.current) {
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
      frameId = null;
    };

    const handleScroll = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateVisibility);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with a Homz advisor on WhatsApp"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      data-testid="link-floating-whatsapp"
      className={`fixed bottom-20 right-5 z-[70] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_40px_rgba(37,211,102,0.32)] transition-all duration-300 hover:scale-105 hover:bg-[#20bd5a] md:bottom-8 md:right-8 ${
        visible
          ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-4 scale-90 opacity-0"
      }`}
    >
      <SiWhatsapp size={29} aria-hidden="true" />
    </a>
  );
};

export default FloatingWhatsApp;
