import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import AppProviders from "@/components/providers/AppProviders";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const viewport: Viewport = {
  themeColor: "#080b11",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cyber Apple Store - Authorized Premium Apple Reseller Indonesia",
    template: "%s | Cyber Apple Store",
  },
  description:
    "Beli produk Apple resmi bergaransi di Cyber Apple Store Indonesia. Dapatkan iPhone 15 Pro, MacBook Pro M3, iPad, Apple Watch, dan AirPods dengan promo cicilan 0% dan garansi resmi 1 tahun.",
  keywords: [
    "Apple Store Indonesia",
    "Apple Authorized Reseller",
    "Beli iPhone Resmi",
    "iPhone 15 Pro Max",
    "MacBook Pro M3",
    "MacBook Air",
    "iPad Pro M4",
    "Apple Watch Ultra 2",
    "AirPods Pro Gen 2",
    "Garansi Resmi iBox",
    "Cicilan 0% Apple",
    "Cyber Store",
  ],
  authors: [{ name: "Cyber Apple Store Indonesia", url: siteUrl }],
  creator: "Cyber Apple Store",
  publisher: "Cyber Apple Store Indonesia",
  alternates: {
    canonical: siteUrl,
  },
  manifest: "/manifest.json",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Cyber Apple Store Indonesia",
    title: "Cyber Apple Store - Authorized Premium Apple Reseller Indonesia",
    description:
      "Pusat belanja produk original Apple resmi bergaransi di Indonesia. Nikmati promo eksklusif, cicilan 0%, dan gratis ongkir ke seluruh nusantara.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cyber Apple Store Indonesia - Authorized Apple Reseller",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cyber Apple Store - Authorized Premium Apple Reseller",
    description:
      "Beli produk Apple bergaransi resmi di Indonesia dengan promo cicilan 0% dan pengiriman ekspres ke seluruh Indonesia.",
    images: ["/og-image.jpg"],
    creator: "@cyberapplestore",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Cyber Apple Store Indonesia",
        description:
          "Authorized Premium Apple Reseller resmi di Indonesia. Belanja iPhone, Mac, iPad, dan aksesoris resmi.",
        potentialAction: [
          {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${siteUrl}/shop?search={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        ],
      },
      {
        "@type": "ElectronicsStore",
        "@id": `${siteUrl}/#store`,
        name: "Cyber Apple Store Indonesia",
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        image: `${siteUrl}/og-image.jpg`,
        description:
          "Authorized Premium Apple Reseller resmi di Indonesia. Menyediakan iPhone, MacBook, iPad, Apple Watch, dan AirPods bergaransi resmi.",
        telephone: "+62-21-555-0199",
        currenciesAccepted: "IDR",
        paymentAccepted:
          "Credit Card, Bank Transfer, QRIS, GoPay, BCA Virtual Account",
        address: {
          "@type": "PostalAddress",
          streetAddress:
            "Menara Cyber Lt. 18, Jl. HR Rasuna Said Blok X-5 Kav. 1-2",
          addressLocality: "Jakarta Selatan",
          addressRegion: "DKI Jakarta",
          postalCode: "12950",
          addressCountry: "ID",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: -6.2297465,
          longitude: 106.829518,
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "09:00",
          closes: "21:00",
        },
        priceRange: "Rp Rp Rp",
      },
    ],
  };

  return (
    <html className="scroll-smooth" lang="id">
      <head>
        <Script
          type="text/javascript"
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.MIDTRANS_CLIENT_KEY}
        />
        <Script
          type="text/javascript"
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
          strategy="afterInteractive"
        />
        <Script
          type="text/javascript"
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
