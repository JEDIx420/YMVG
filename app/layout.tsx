import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/utils/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ys Mens International South West India Region",
  description: "International Business Directory and Regional Hub for Y's Men International South West India Region (SWIR)",
  other: {
    "application-name": "Ys Mens International South West India Region",
  },
  openGraph: {
    title: "Ys Mens International South West India Region",
    description: "International Business Directory and Regional Hub for Y's Men International South West India Region (SWIR)",
    siteName: "Ys Mens International South West India Region",
    url: "https://ysmenswir-v.com",
    type: "website",
    images: [
      {
        url: "https://ysmenswir-v.com/favicon.png",
        width: 144,
        height: 144,
        alt: "Ys Mens International South West India Region Logo",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "144x144", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [
      { url: "/favicon.png", sizes: "144x144", type: "image/png" }
    ]
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Ys Mens International South West India Region",
    "alternateName": [
      "Ys Mens Internation South West India Region",
      "Y's Men's International South West India Region",
      "Y's Men International South West India Region",
      "YMI SWIR",
      "YMI South West India Region"
    ],
    "url": "https://ysmenswir-v.com/"
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Ys Mens International South West India Region",
    "url": "https://ysmenswir-v.com/",
    "logo": "https://ysmenswir-v.com/favicon.png",
    "image": "https://ysmenswir-v.com/favicon.png"
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white">
        <Navbar user={data?.user || null} />
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
