"use client";

import { useState } from "react";
import { toast } from "sonner";

type UserResult = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "agent" | "admin" | "super_admin";
};

const ROLE_BADGE: Record<UserResult["role"], string> = {
  customer: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  agent: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  admin: "bg-green-500/15 text-green-400 border-green-500/30",
  super_admin: "bg-[#D9B268]/15 text-[#D9B268] border-[#D9B268]/30",
};

// Revoking sets the target back to a specific role rather than restoring an
// "old" one — role is a single field with no history, so the super admin
// picks what the user becomes next (mirrors updateUserRoleSchema's enum).
export default function ManageAdmins() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [revertRoleById, setRevertRoleById] = useState<Record<string, "customer" | "agent">>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      toast.error("Enter at least 2 characters");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      setResults(json.users);
    } catch {
      setError("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (
    id: string,
    role: "customer" | "agent" | "admin",
    confirmMessage: string
  ) => {
    if (!window.confirm(confirmMessage)) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      toast.success(role === "admin" ? "Admin access granted" : "Admin access revoked");
      setResults((prev) => prev && prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          placeholder="Search by email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-6 py-3 font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {results && results.length === 0 && (
        <p className="text-sm text-gray-400">No users found for &quot;{query}&quot;.</p>
      )}

      {results && results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((u) => (
            <div
              key={u.id}
              className="rounded-[18px] border border-white/[0.08] bg-[#141416] p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">{u.name}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${ROLE_BADGE[u.role]}`}
                  >
                    {u.role.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>

              {u.role === "super_admin" && (
                <p className="text-xs text-gray-500 italic">Managed via backend script</p>
              )}

              {(u.role === "customer" || u.role === "agent") && (
                <button
                  onClick={() => updateRole(u.id, "admin", `Grant admin access to ${u.email}?`)}
                  disabled={updatingId === u.id}
                  className="rounded-lg border border-[#D9B268]/40 px-4 py-2 text-xs font-semibold text-[#D9B268] hover:bg-[#D9B268]/10 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Grant Admin
                </button>
              )}

              {u.role === "admin" && (
                <div className="flex items-center gap-2">
                  <select
                    value={revertRoleById[u.id] || "customer"}
                    onChange={(e) =>
                      setRevertRoleById((prev) => ({
                        ...prev,
                        [u.id]: e.target.value as "customer" | "agent",
                      }))
                    }
                    className="rounded-lg border border-white/10 bg-[#1a1a1d] px-2 py-2 text-xs text-white outline-none focus:border-[#D9B268] transition-colors"
                  >
                    <option value="customer">Revert to Customer</option>
                    <option value="agent">Revert to Agent</option>
                  </select>
                  <button
                    onClick={() =>
                      updateRole(
                        u.id,
                        revertRoleById[u.id] || "customer",
                        `Revoke admin access from ${u.email}?`
                      )
                    }
                    disabled={updatingId === u.id}
                    className="rounded-lg border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Revoke Admin
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
