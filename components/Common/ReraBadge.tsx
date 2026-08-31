// Shared RERA display — a correctly-shaped reraId is not the same thing as
// an active registration. Verified live 2026-08-31: Ireo Skyon carries a
// real, well-formed RERA number whose only registration on file with HRERA
// is a 2017 interim filing that lapsed in 2018 — showing that bare number
// with a green checkmark would misrepresent it as currently registered.
// `reraStatus` (from the backend's rera_badge_status, see
// lib/scraping/homzbackend.ts) is the source of truth, not whether reraId
// is merely present.

type Props = {
  reraId?: string | null;
  status?: string | null;
  /** Compact: inline pill for cards. Full: labelled row for detail pages. */
  variant?: "compact" | "full";
};

const STYLES: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: "RERA Verified",
    className: "border-[#63C08D]/30 bg-[#63C08D]/14 text-[#7fd3a5]",
  },
  lapsed: {
    label: "RERA Lapsed",
    className: "border-[#E1684A]/35 bg-[#E1684A]/14 text-[#f0967f]",
  },
  unverified: {
    label: "RERA Unverified",
    className: "border-white/10 bg-white/[0.06] text-gray-300",
  },
  not_registered: {
    label: "Not RERA Registered",
    className: "border-white/10 bg-white/[0.06] text-gray-500",
  },
};

export default function ReraBadge({ reraId, status, variant = "compact" }: Props) {
  // Unknown/missing status (e.g. older data this pipeline hasn't touched)
  // degrades to a plain neutral display rather than a false "verified" claim.
  const resolved = status && STYLES[status] ? status : reraId ? "unverified" : "not_registered";
  const { label, className } = STYLES[resolved];

  if (variant === "full") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${className}`}
      >
        {label}
        {reraId ? ` · ${reraId}` : ""}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${className}`}>
      {reraId ? `RERA: ${reraId}` : label}
    </div>
  );
}
