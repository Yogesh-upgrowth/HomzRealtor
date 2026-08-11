import { redirect } from "next/navigation";

export default function DashboardIndexPage() {
  redirect("/dashboard/list-property");
}
