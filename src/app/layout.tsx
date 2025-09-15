import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ['latin'] })
const siteUrl = "https://abfahrt.live";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "abfahrt.live",
  description: "Generate your own MVG departure board.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "abfahrt.live",
    title: "abfahrt.live",
    description: "Generate your own MVG departure board.",
    images: [
      {url: "/og.png", width: 1200, height: 630, alt: "Preview image"},
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: "@abfahrt.live",
    creator: "@niklaschble",
    title: "abfahrt.live",
    description: "Generate your own custom MVG departure board.",
    images: ["/og.png"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-gray-950">
      <body
        className={`${inter.className} antialiased`}
      >
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
