import ComingSoon from "@/components/Common/ComingSoon";

export const metadata = {
  title: "Commercial — Coming Soon",
  description:
    "Commercial listings are coming soon to Homz. Unlock commercial spaces designed for growth, visibility, and long-term success.",
  alternates: {
    canonical: "/commercial",
  },
};

export default function CommercialPage() {
  return (
    <ComingSoon
      title="Commercial"
      description="Unlock commercial spaces designed for growth, visibility, and long-term success. This section is coming soon — stay tuned!"
    />
  );
}
