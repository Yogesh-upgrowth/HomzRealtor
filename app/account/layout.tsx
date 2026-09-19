import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { instrumentSerif, manrope } from "@/lib/fonts";
import AccountGate from "@/components/Account/AccountGate";

import type { Metadata } from "next";

// Audit item 11 (2026-09-19): this tree had neither a noindex directive nor a
// robots.txt disallow, so the shell of a private area was indexable. Declared
// at the layout so every nested route inherits it rather than each page having
// to remember. follow:false as well -- there is nothing here worth crawling
// onward from.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    return <AccountGate />;
  }
  // Agents manage their info on the combined /dashboard/profile page instead
  // of having two separate places to edit the same fields.
  if (user.role === "agent") {
    redirect("/dashboard/profile");
  }

  return (
    <div
      className={`${instrumentSerif.variable} ${manrope.variable} font-ui min-h-screen bg-[#0B0B0C] text-white pt-28 pb-16`}
    >
      {children}
    </div>
  );
}
