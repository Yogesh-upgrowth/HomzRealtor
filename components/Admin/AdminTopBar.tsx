"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type AdminTopBarProps = {
  userName: string;
};

export default function AdminTopBar({ userName }: AdminTopBarProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="border-b border-white/[0.08] bg-[#0B0B0C]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/admin" className="text-lg font-bold bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] bg-clip-text text-transparent">
          HomzRealtor Admin
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">Hi, {userName}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-gray-300 hover:border-[#D9B268]/40 hover:text-[#D9B268] transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
