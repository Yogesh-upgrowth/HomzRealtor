import type { Metadata } from "next";
import OpenAuthModalRedirect from "@/components/Auth/OpenAuthModalRedirect";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a HomzRealtor customer or agent account.",
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return <OpenAuthModalRedirect mode="signup" />;
}
