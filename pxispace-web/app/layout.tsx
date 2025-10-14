import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "PXI — Pick • Print • Post",
  description: "PXIClip transforms your device into an instant camera.",
  icons: {
    icon: "/assets/favicon.png",
    apple: "/assets/favicon.png",
  },
  openGraph: {
    type: "website",
    title: "PXI — Pick • Print • Post",
    description: "PXIClip transforms your device into an instant camera.",
    images: [
      {
        url: "https://pxispace.com/assets/pxi-logo-og.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PXI — Pick • Print • Post",
    description: "PXIClip transforms your device into an instant camera.",
    images: ["https://pxispace.com/assets/pxi-logo-og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen">
        <Providers>
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
