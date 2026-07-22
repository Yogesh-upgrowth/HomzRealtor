import type { Metadata } from "next";
import OpenAuthModalRedirect from "@/components/Auth/OpenAuthModalRedirect";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your HomzRealtor customer or agent account.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <OpenAuthModalRedirect mode="login" />;
}
