import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApplicationProvider } from "@/contexts";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "LMA Bridge - Syndicated Loan Lifecycle Platform",
  description: "AI-powered syndicated loan management platform for the LMA Hackathon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-inter antialiased`}
      >
        <ApplicationProvider>
          {children}
        </ApplicationProvider>
      </body>
    </html>
  );
}
