import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://laviius.com"),
  title: "Laviius — Commercial Local Freight, Booked in Under 60 Seconds",
  description:
    "Laviius connects warehouses, 3PLs, and distributors with trusted local commercial carriers. Book same-day cartage, white-glove, and first/last-mile freight with real-time tracking and digital proof of delivery.",
  keywords: [
    "local freight booking",
    "same-day cartage",
    "white glove delivery",
    "last-mile delivery",
    "first-mile delivery",
    "commercial freight platform",
    "3PL freight booking",
    "Vancouver local carriers",
  ],
  openGraph: {
    type: "website",
    url: "https://laviius.com/",
    title: "Laviius — Commercial Local Freight, Booked in Under 60 Seconds",
    description:
      "Book trusted local cartage, white-glove, and same-day freight with complete visibility from pickup to proof of delivery.",
    siteName: "Laviius",
  },
  twitter: {
    card: "summary_large_image",
    title: "Laviius — Commercial Local Freight, Booked in Under 60 Seconds",
    description:
      "Book trusted local cartage, white-glove, and same-day freight with complete visibility from pickup to proof of delivery.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-white text-navy antialiased">
        {children}
      </body>
    </html>
  );
}
