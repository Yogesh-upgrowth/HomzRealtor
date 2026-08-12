import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { instrumentSerif, manrope } from "@/lib/fonts";
import AccountGate from "@/components/Account/AccountGate";

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
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="font-display text-3xl mb-6">My Account</h1>
        {children}
      </div>
    </div>
  );
}
