"use client";

import Link from "next/link";
import { Home, Search, Building2, PhoneCall, HelpCircle } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/project-listing", label: "Properties", icon: Search },
  { href: "/developer", label: "Developers", icon: Building2 },
  { href: "#consult", label: "Consult", icon: PhoneCall },
  { href: "#faq", label: "FAQ", icon: HelpCircle },
];

// Page-scoped, mobile-only fixed bar — same spirit as
// components/Project/listing/StickyCta.tsx's mobile sticky bar.
const MobileBottomNav = () => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-around border-t border-white/[0.08] bg-[#0e0e10]/95 backdrop-blur-lg py-2 md:hidden">
      {ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex min-w-[48px] flex-col items-center gap-1 px-2 py-1.5 text-[10.5px] font-bold text-gray-500 hover:text-[#D9B268] transition-colors"
        >
          <item.icon size={20} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
