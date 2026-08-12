import { getSessionUser } from "@/lib/auth/session";
import ManageAdmins from "@/components/Admin/ManageAdmins";

// The tab bar already hides this from plain admins, but that's navigation
// only — re-check server-side here too, since a plain admin could still
// browse straight to the URL.
export default async function ManageAdminsPage() {
  const user = await getSessionUser();

  if (user?.role !== "super_admin") {
    return (
      <div className="rounded-[18px] border border-white/[0.08] bg-[#141416] p-10 text-center">
        <h1 className="text-xl font-bold text-white mb-2">Super admins only</h1>
        <p className="text-gray-400 text-sm">
          This screen is restricted to the two super admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Manage Admins</h1>
      <ManageAdmins />
    </div>
  );
}
