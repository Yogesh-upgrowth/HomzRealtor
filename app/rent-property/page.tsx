import ComingSoon from "@/components/Common/ComingSoon";

export const metadata = {
  title: "Rent Property — Coming Soon",
  description:
    "Rent Property listings are coming soon to Homz. Choose from various rental options tailored to your preferences and convenience.",
  alternates: {
    canonical: "/rent-property",
  },
};

export default function RentPropertyPage() {
  return (
    <ComingSoon
      title="Rent Property"
      description="Choose from various rental options tailored to your preferences and convenience. This section is coming soon — stay tuned!"
    />
  );
}
