"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import LoadError from "@/components/Common/LoadError";

type PendingRequest = { id: string; name: string; email: string; requestedAt: string };
type CurrentAdmin = { id: string; name: string; email: string; grantedAt: string | null };

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ManageAdmins() {
  const [pending, setPending] = useState<PendingRequest[] | null>(null);
  const [admins, setAdmins] = useState<CurrentAdmin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, adminRes] = await Promise.all([
        fetch("/api/admin/requests"),
        fetch("/api/admin/admins"),
      ]);
      if (!reqRes.ok || !adminRes.ok) throw new Error("Failed to load");
      const reqJson = await reqRes.json();
      const adminJson = await adminRes.json();
      setPending(reqJson.requests);
      setAdmins(adminJson.admins);
    } catch {
      setError("Couldn't load admin management data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const decide = async (id: string, action: "approve" | "reject") => {
    const confirmMessage =
      action === "approve"
        ? "Grant admin access to this applicant?"
        : "Reject this application? The account will be deleted entirely — they'd need to apply again.";
    if (!window.confirm(confirmMessage)) return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      toast.success(action === "approve" ? "Admin access granted" : "Application rejected");
      await fetchAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (id: string, email: string) => {
    if (
      !window.confirm(
        `Revoke admin access from ${email}? Their account will be deleted entirely — they'd need to apply again from scratch.`
      )
    )
      return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/admins/${id}/revoke`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      toast.success("Admin access revoked and account removed");
      await fetchAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <LoadError message={error} onRetry={fetchAll} />;

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 rounded-[18px] border border-white/[0.08] bg-[#141416] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Pending Requests</h2>
        {!pending || pending.length === 0 ? (
          <p className="text-sm text-gray-500">No pending admin applications.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((r) => (
              <div
                key={r.id}
                className="rounded-[18px] border border-white/[0.08] bg-[#141416] p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.email}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">Applied {timeAgo(r.requestedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => decide(r.id, "approve")}
                    disabled={busyId === r.id}
                    className="rounded-lg border border-[#D9B268]/40 px-4 py-2 text-xs font-semibold text-[#D9B268] hover:bg-[#D9B268]/10 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(r.id, "reject")}
                    disabled={busyId === r.id}
                    className="rounded-lg border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-white mb-4">Current Admins</h2>
        {!admins || admins.length === 0 ? (
          <p className="text-sm text-gray-500">No plain admins yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {admins.map((a) => (
              <div
                key={a.id}
                className="rounded-[18px] border border-white/[0.08] bg-[#141416] p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{a.name}</p>
                  <p className="text-xs text-gray-500">{a.email}</p>
                  {a.grantedAt && (
                    <p className="text-[11px] text-gray-600 mt-0.5">Granted {timeAgo(a.grantedAt)}</p>
                  )}
                </div>
                <button
                  onClick={() => revoke(a.id, a.email)}
                  disabled={busyId === a.id}
                  className="rounded-lg border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
