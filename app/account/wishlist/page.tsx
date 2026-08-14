import type { Metadata } from "next";
import WishlistList from "@/components/Account/WishlistList";

export const metadata: Metadata = {
  title: "My Wishlist",
};

export default function WishlistPage() {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="font-display text-3xl mb-6">My Wishlist</h1>
      <WishlistList />
    </div>
  );
}
