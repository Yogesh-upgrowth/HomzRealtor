import { getSessionUser } from "@/lib/auth/session";
import { instrumentSerif, manrope } from "@/lib/fonts";
import AdminGate from "@/components/Admin/AdminGate";
import AdminTopBar from "@/components/Admin/AdminTopBar";
import AdminTabs from "@/components/Admin/AdminTabs";

import type { Metadata } from "next";

// Audit item 11 (2026-09-19): this tree had neither a noindex directive nor a
// robots.txt disallow, so the shell of a private area was indexable. Declared
// at the layout so every nested route inherits it rather than each page having
// to remember. follow:false as well -- there is nothing here worth crawling
// onward from.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    return <AdminGate variant="logged-out" />;
  }
  if (user.role !== "admin" && user.role !== "super_admin") {
    return <AdminGate variant="not-admin" />;
  }

  return (
    <div
      className={`${instrumentSerif.variable} ${manrope.variable} font-ui min-h-screen bg-[#0B0B0C] text-white`}
    >
      <AdminTopBar userName={user.name} />
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-16">
        <AdminTabs isSuperAdmin={user.role === "super_admin"} />
        {children}
      </div>
    </div>
  );
}
