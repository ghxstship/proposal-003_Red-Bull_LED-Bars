import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Red Bull LED Curved Mobile Bar — Purchase Proposal | GHXSTSHIP",
  description:
    "Purchase proposal for a custom-fabricated, LED-illuminated curved mobile bar system for Red Bull North America. Three hardware tiers (Static / RGBW / DMX-controlled RGBAW), rush pricing, and à la carte upgrades. Prepared by GHXSTSHIP.",
  keywords:
    "Red Bull, LED bar, illuminated mobile bar, brand activation, custom fabrication, RGBW, DMX lighting, GHXSTSHIP, purchase proposal",
  openGraph: {
    title: "Red Bull LED Curved Mobile Bar — Purchase Proposal",
    description: "Purchase proposal by GHXSTSHIP for Red Bull North America",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
