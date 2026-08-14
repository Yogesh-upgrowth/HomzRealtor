"use client";

import { Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist, type WishlistInput } from "@/context/WishlistContext";

type SaveToggleButtonProps = {
  item: WishlistInput;
  // "overlay": compact pill for a card thumbnail overlay.
  // "block": full-width footer button, used on the wishlist page itself.
  variant?: "overlay" | "block";
  className?: string;
};

// Only ever visible to a logged-in customer — agents/admins/super_admins and
// anonymous visitors never see a save icon at all, by design.
export default function SaveToggleButton({ item, variant = "overlay", className = "" }: SaveToggleButtonProps) {
  const { user } = useAuth();
  const { isSaved, toggle } = useWishlist();

  if (!user || user.role !== "customer") return null;

  const saved = isSaved(item.itemType, item.citySegment, item.slug);

  const overlayClass = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
    saved
      ? "border-[#D9B268]/50 bg-[#D9B268]/20 text-[#D9B268]"
      : "border-white/20 bg-black/55 text-white hover:border-[#D9B268]/50"
  }`;
  const blockClass = `w-full flex items-center justify-center gap-2 border-t border-white/[0.08] py-3 text-sm font-semibold transition cursor-pointer ${
    saved ? "text-red-400 hover:bg-red-500/10" : "text-[#D9B268] hover:bg-[#D9B268]/10"
  }`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      className={`${variant === "overlay" ? overlayClass : blockClass} ${className}`}
    >
      <Heart size={13} fill={saved ? "currentColor" : "none"} />
      {saved ? "Undo" : "Wishlist"}
    </button>
  );
}
