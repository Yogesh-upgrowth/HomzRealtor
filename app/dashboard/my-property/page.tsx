import type { Metadata } from "next";
import MyPropertyList from "@/components/Dashboard/MyPropertyList";

export const metadata: Metadata = {
  title: "My Property",
};

export default function MyPropertyPage() {
  return <MyPropertyList />;
}
