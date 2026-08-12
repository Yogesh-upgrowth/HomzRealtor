"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminTabsProps = {
  isSuperAdmin: boolean;
};

export default function AdminTabs({ isSuperAdmin }: AdminTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin/review-queue", label: "Review Queue" },
    { href: "/admin/listings", label: "All Listings" },
    ...(isSuperAdmin ? [{ href: "/admin/manage-admins", label: "Manage Admins" }] : []),
  ];

  return (
    <div className="flex gap-2 mb-6 border-b border-white/[0.08]">
      {tabs.map((tab) => {
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
