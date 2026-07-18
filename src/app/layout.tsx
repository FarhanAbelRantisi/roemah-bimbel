import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://roemahbimbel.com"),
  title: "Roemah Bimbel",
  description: "Platform simulasi ujian SKD, CPNS, dan Kedinasan.",
  icons: {
    icon: "/favico.ico",
    apple: "/favico.ico",
  },
  openGraph: {
    title: "Roemah Bimbel",
    description: "Platform simulasi ujian SKD, CPNS, dan Kedinasan.",
    url: "https://roemahbimbel.com",
    siteName: "Roemah Bimbel",
    images: [
      {
        url: "/images/logo_roemahbimbel.png",
        width: 800,
        height: 800,
        alt: "Logo Roemah Bimbel",
      }
    ],
    locale: "id_ID",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
