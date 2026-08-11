import { getSessionUser } from "@/lib/auth/session";
import { instrumentSerif, manrope } from "@/lib/fonts";
import DashboardGate from "@/components/Dashboard/DashboardGate";
import DashboardTabs from "@/components/Dashboard/DashboardTabs";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    return <DashboardGate variant="logged-out" />;
  }
  if (user.role !== "agent") {
    return <DashboardGate variant="not-agent" />;
  }

  return (
    <div
      className={`${instrumentSerif.variable} ${manrope.variable} font-ui min-h-screen bg-[#0B0B0C] text-white pt-28 pb-16`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <DashboardTabs />
        {children}
      </div>
    </div>
  );
}
