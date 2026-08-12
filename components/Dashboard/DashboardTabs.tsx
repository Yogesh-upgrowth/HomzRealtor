"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/list-property", label: "List Property" },
  { href: "/dashboard/my-property", label: "My Property" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default function DashboardTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 mb-6 border-b border-white/[0.08]">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              isActive
                ? "border-[#D9B268] text-[#D9B268]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
