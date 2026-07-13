import ComingSoon from "@/components/Common/ComingSoon";

export const metadata = {
  title: "Buy Property — Coming Soon",
  description:
    "Buy Property listings are coming soon to Homz. Explore a wide range of options to buy your dream property with ease and confidence.",
  alternates: {
    canonical: "/buy-property",
  },
};

export default function BuyPropertyPage() {
  return (
    <ComingSoon
      title="Buy Property"
      description="Explore a wide range of options to buy your dream property with ease and confidence. This section is coming soon — stay tuned!"
    />
  );
}
