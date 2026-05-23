import type { Metadata } from "next";
import { IBM_Plex_Sans, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import AppLayout from "@/components/layout/AppLayout";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | 7Eleven Shop",
    default: "7Eleven Shop",
  },
  description: "Hệ thống mua sắm và quản lý đơn hàng Next-generation 7-Eleven Convenience Store",
  keywords: ["7eleven", "7-eleven", "cửa hàng tiện lợi", "mua sắm online", "7eleven shop"],
  openGraph: {
    title: "7Eleven Shop",
    description: "Hệ thống mua sắm và quản lý đơn hàng Next-generation 7-Eleven Convenience Store",
    type: "website",
    locale: "vi_VN",
  },
  twitter: {
    card: "summary_large_image",
    title: "7Eleven Shop",
    description: "Hệ thống mua sắm và quản lý đơn hàng Next-generation 7-Eleven Convenience Store",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${geistMono.className} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}

