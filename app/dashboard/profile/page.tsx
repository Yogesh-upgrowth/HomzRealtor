import type { Metadata } from "next";
import AgentProfileView from "@/components/Dashboard/AgentProfileView";

export const metadata: Metadata = {
  title: "My Profile",
};

export default function DashboardProfilePage() {
  return <AgentProfileView />;
}
