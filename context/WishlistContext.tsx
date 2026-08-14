"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type WishlistItemType = "project" | "property";
export type WishlistPropertyCategory = "Sale" | "Rent" | "Pg" | "Commercial";

export type WishlistItem = {
  id: string;
  itemType: WishlistItemType;
  citySegment: string;
  slug: string;
  propertyId: string | null;
  category: WishlistPropertyCategory | null;
  title: string;
  imageUrl: string | null;
  priceText: string | null;
  locationText: string | null;
  href: string;
  createdAt: string;
};

// What a card needs to supply to save something — a subset of WishlistItem,
// missing only the server-assigned id/href/createdAt.
export type WishlistInput = {
  itemType: WishlistItemType;
  citySegment: string;
  slug: string;
  propertyId?: string | null;
  category?: WishlistPropertyCategory | null;
  title: string;
  imageUrl?: string | null;
  priceText?: string | null;
  locationText?: string | null;
};

type WishlistContextType = {
  items: WishlistItem[];
  loading: boolean;
  isSaved: (itemType: WishlistItemType, citySegment: string, slug: string) => boolean;
  toggle: (item: WishlistInput) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  loading: false,
  isSaved: () => false,
  toggle: async () => {},
});

function sameItem(a: { itemType: string; citySegment: string; slug: string }, b: typeof a) {
  return a.itemType === b.itemType && a.citySegment === b.citySegment && a.slug === b.slug;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const isCustomer = user?.role === "customer";

  useEffect(() => {
    if (!isCustomer) {
      setItems([]);
      return;
    }
    setLoading(true);
    fetch("/api/wishlist")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setItems(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isCustomer]);

  const isSaved = useCallback(
    (itemType: WishlistItemType, citySegment: string, slug: string) =>
      items.some((i) => sameItem(i, { itemType, citySegment, slug })),
    [items]
  );

  const toggle = useCallback(
    async (item: WishlistInput) => {
      if (!isCustomer) return;
      const key = { itemType: item.itemType, citySegment: item.citySegment, slug: item.slug };
      const existing = items.find((i) => sameItem(i, key));

      if (existing) {
        setItems((prev) => prev.filter((i) => !sameItem(i, key)));
        const res = await fetch("/api/wishlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(key),
        });
        if (!res.ok) setItems((prev) => [existing, ...prev]); // resync on failure
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (res.ok) {
          const data = await res.json();
          setItems((prev) => [data.item, ...prev]);
        }
      }
    },
    [isCustomer, items]
  );

  return (
    <WishlistContext.Provider value={{ items, loading, isSaved, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
