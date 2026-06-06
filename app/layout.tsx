import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FormProvider } from "@/context/FormContext";
import FormComponent from "@/components/FormComponent";
import { Suspense } from "react";
import GoogleAnalyticsTracker from "@/components/GoogleAnalyticsTracker";

// app/layout.tsx

export const metadata = {
  title : "Homz - Your Ultimate Home searching Companion",
  description: "Discover your dream home with Homz - the ultimate home searching companion. Find the perfect property, compare prices, and get expert advice all in one place.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <FormProvider>
          <Header />
          <FormComponent />
          {children}
          <Footer />
          <Suspense fallback={null}>
            <GoogleAnalyticsTracker />
          </Suspense>
        </FormProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
