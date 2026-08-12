import type { Metadata } from "next";
import CustomerProfileForm from "@/components/Account/CustomerProfileForm";

export const metadata: Metadata = {
  title: "My Account",
};

export default function AccountPage() {
  return <CustomerProfileForm />;
}
