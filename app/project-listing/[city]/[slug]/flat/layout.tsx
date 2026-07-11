import type { Metadata } from "next";

// Enquiry pages duplicate the project page's content — keep them out of
// Google's index so crawl budget and ranking signals stay on the project page.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function EnquireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
