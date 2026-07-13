import ComingSoon from "@/components/Common/ComingSoon";

export const metadata = {
  title: "Plots & Lands — Coming Soon",
  description:
    "Plots & Lands listings are coming soon to Homz. Find the perfect plot or land for your dream project, investment, or development plan.",
  alternates: {
    canonical: "/plots-and-lands",
  },
};

export default function PlotsAndLandsPage() {
  return (
    <ComingSoon
      title="Plots & Lands"
      description="Find the perfect plot or land for your dream project, investment, or development plan. This section is coming soon — stay tuned!"
    />
  );
}
