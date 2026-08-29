import ComingSoon from "@/components/Common/ComingSoon";
import discoverImage3 from "@/assets/images/discoverImage3.jpg";

const title = "Plots & Lands — Coming Soon";
const description =
  "Plots & Lands listings are coming soon to HomzRealtor. Find the perfect plot or land for your dream project, investment, or development plan.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/plots-and-lands",
  },
  // A live "coming soon" placeholder with no real inventory shouldn't be
  // indexed as if it were a listings page — re-enable once plots go live.
  robots: { index: false, follow: true },
  openGraph: {
    title,
    description,
    images: [
      {
        url: discoverImage3.src,
        width: discoverImage3.width,
        height: discoverImage3.height,
        alt: "Plots and land for sale in Gurgaon",
      },
    ],
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
