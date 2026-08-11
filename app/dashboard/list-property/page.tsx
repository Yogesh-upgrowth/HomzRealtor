import type { Metadata } from "next";
import ListPropertyWizard from "@/components/Dashboard/ListPropertyWizard/ListPropertyWizard";

export const metadata: Metadata = {
  title: "List Your Property",
};

export default function ListPropertyPage() {
  return <ListPropertyWizard />;
}
