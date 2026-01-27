import type { Metadata } from "next";
import { IM_Fell_English, Geist_Mono } from "next/font/google";
import "./globals.css";

const imFellEnglish = IM_Fell_English({
  variable: "--font-fell",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vitrum - Stained Glass Generator",
  description: "Transform your images into beautiful stained glass designs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${imFellEnglish.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
