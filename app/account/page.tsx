import type { Metadata } from "next";
import CustomerProfileForm from "@/components/Account/CustomerProfileForm";

export const metadata: Metadata = {
  title: "My Account",
};

export default function AccountPage() {
  return (
    <div className="max-w-2xl mx-auto px-4">
      <h1 className="font-display text-3xl mb-6">My Account</h1>
      <CustomerProfileForm />
    </div>
  );
}
