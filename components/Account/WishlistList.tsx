"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import SaveToggleButton from "@/components/Common/SaveToggleButton";

const CardSkeleton = () => (
  <div className="w-full rounded-[18px] overflow-hidden border border-white/[0.08] bg-[#141416] animate-pulse">
    <div className="w-full h-[180px] bg-white/5" />
    <div className="p-4 space-y-3">
      <div className="h-4 w-2/3 bg-white/5 rounded" />
      <div className="h-4 w-1/3 bg-white/5 rounded" />
    </div>
  </div>
);

export default function WishlistList() {
  const { items, loading } = useWishlist();

  if (loading && items.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[18px] border border-white/[0.08] bg-[#141416] py-16 px-6 text-center">
        <Heart size={40} className="mx-auto text-gray-600 mb-4" />
        <h3 className="text-white font-bold mb-1">Your wishlist is empty</h3>
        <p className="text-gray-400 text-sm mb-6">Save properties you like and they&apos;ll show up here.</p>
        <Link
          href="/project-listing"
          className="inline-block rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-6 py-3 font-bold text-[#1c1608] hover:brightness-105 transition"
        >
          Browse Properties
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item.id} className="rounded-[18px] overflow-hidden border border-white/[0.08] bg-[#141416]">
          <Link href={item.href} className="block">
            <div className="relative h-44 w-full bg-white/5">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-600 text-sm">
                  No Image
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">{item.title}</h3>
              {item.locationText && <p className="text-gray-400 text-xs mb-2">{item.locationText}</p>}
              {item.priceText && <p className="text-[#D9B268] font-bold text-sm">{item.priceText}</p>}
            </div>
          </Link>
          <SaveToggleButton
            variant="block"
            item={{
              itemType: item.itemType,
              citySegment: item.citySegment,
              slug: item.slug,
              title: item.title,
            }}
          />
        </div>
      ))}
    </div>
  );
}
